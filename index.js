var sysutil = require('util');
var vm = require('vm');

var Lexer = module.exports = {
    _addop: "\\+|-",
    _mulop: "\\*|/",
    _powop: "\\^",
    _function1: "sqrt|abs|ln|exp",
    _function2: "root|log",
    _variable: "[a-zA-Z](?:[a-zA-Z0-9])*",
    _number: "\\d*(?:\\.\\d*)?",
    _open: "\\(",
    _close: "\\)",

    parseString: function (str, stringrep){
        /* Rules:
         * Start -> Expr
         * Expr -> Expr _addop Term1
         * Expr -> Term1
         * Term1 -> Term1 _mulop Term2
         * Term1 -> Term2
         * Term2 -> Term2 _powop Num
         * Term2 -> Num
         * Num -> Int|Float
         * Num -> _variable
         * Num -> _function1 _open Expr _close
         * Num -> _function2 _open Expr, Expr _close
         * Num -> _open Expr _close
         */

        /* States:
         * Start
         * Error
         * Accept
         * Expr
         * Term1
         * Term2
         * Num
         * Int
         * Float
         * _variable
         * _open
         * _close
         */
        
        if (!str || typeof(str) != "string"){
            throw new this.ParseError("Parse error: No string provided.");
        }

        var _lexer = this;

        var _result = "";

        function majorCommaIndex(str){
            var _ptr = 0;
            var _pcount = 0;
            var _comma = -1;
            var _len = str.length;

            while(_ptr < _len){
                if (str[_ptr].match(new RegExp(_lexer._open))){
                    _pcount++;
                    _ptr++;
                }
                else if (str[_ptr].match(new RegExp(_lexer._close))){
                    _pcount--;
                    _ptr++;
                }
                else if (_pcount == 0 && str[_ptr] == ","){
                    if (_comma > -1){
                        return -1;
                    }
                    else {
                        _comma = _ptr;
                        _ptr++;
                    }
                }
                else {
                    _ptr++;
                }
            }

            return _comma;
        }

        function majorOpIndex(str){
            var _ptr = 0;
            var _len = str.length;
            var _pcount = 0;
            var _mop = -1;
            var _moptype = null;
            var _match;

            while (_ptr < _len){
                if (str[_ptr].match(new RegExp(_lexer._open))){
                    if (_pcount == 0 && _mop == -1){
                        _mop = _ptr;
                        _moptype = "Group";
                    }
                    else if (_pcount == 0 && _moptype == "Group"){
                        return [-1, null];
                    }

                    _pcount++;
                    _ptr++;
                }
                else if (str[_ptr].match(new RegExp(_lexer._close))){
                    _pcount--;
                    _ptr++;
                }
                else if (_pcount == 0) {
                    var sstr = str.substring(_ptr);
                    if (sstr.match(new RegExp("^(?:"+_lexer._addop+")"))){
                        
                        if (!(_moptype == "AddOp" || _moptype == "MulOp" || _moptype == "PowOp") || 
                                (str.substring(_mop + 1, _ptr).match(/[^\s]/) &&
                                    !str.substring(0, _ptr).match(new RegExp("(?:"+_lexer._addop+"|"+_lexer._mulop+"|"+_lexer._powop+")\\s*$")))){
                            _mop = _ptr;
                            _moptype = "AddOp";
                        }
                        _ptr++;
                    }
                    else if (_moptype != "AddOp" && sstr.match(new RegExp("^(?:"+_lexer._mulop+")"))){
                        _mop = _ptr;
                        _moptype = "MulOp";
                        _ptr++;
                    }
                    else if (_moptype != "AddOp" && _moptype != "MulOp" && sstr.match(new RegExp("^(?:"+_lexer._powop+")"))){
                        if (_moptype == "PowOp"){
                            return [-1, "PowOp"];
                        }
                        else {
                            _mop = _ptr;
                            _moptype = "PowOp";
                            _ptr++;
                        }
                    }
                    else if (_moptype != "AddOp" && _moptype != "MulOp" && _moptype != "PowOp" && (_match = sstr.match(new RegExp("^(?:"+_lexer._function1+"|"+_lexer._function2+")")))){
                        if (_moptype == "FuncOp"){
                            return [-1, "FuncOp"];
                        }
                        else {
                            _mop = _ptr;
                            _moptype = "FuncOp";
                            _ptr += _match[0].length;
                        }
                    }
                    else {
                        _ptr++;
                    }
                }
                else {
                    _ptr++;
                }
            }

            return [_mop, _moptype];
        }

        function _parseString(str){
            var _state = "Start";
            var _stack = [];
            var _pointer = 0;
            var _majoropindex = -1;
            var _strlen = str.length;
            var _accepted = false;

            var _statefuncs = {
                "Start": function (fwdstring){
                    if (!fwdstring){
                        _state = "Error";
                        return;
                    }

                    if (fwdstring[0].match(/\s/)){
                        _pointer++;
                        return;
                    }

                    var _majorop = majorOpIndex(fwdstring);

                    if (_majorop[0] > -1){
                        _state = _majorop[1];
                        _majoropindex = _majorop[0];
                        return;
                    }
                    else if (_majorop[1]) {
                        _state = "Error";
                        return;
                    }
                    else {
                        if (fwdstring.match(new RegExp("^"+_lexer._variable))){
                            _state = "Variable";
                            return;
                        }

                        if (fwdstring.match(new RegExp("^"+_lexer._number))){
                            _state = "Number";
                            return;
                        }
                    }
                    
                    _state = "Error";
                    return;

                },
                "Accept": function (){
                    _accepted = true;
                },
                "Error": function (){
                    throw new _lexer.ParseError();
                },
                "Number": function (fwdstring){
                    var _match = fwdstring.match(new RegExp("^"+_lexer._number));

                    if (!_match || fwdstring.substring(_match[0].length).match(/[^\s]/)){
                        _state = "Error";
                        return;
                    }
                    else {
                        var _num = parseFloat(_match[0]);
                        _stack.push(["idem", _num]);
                        _state = "Accept";
                        return;
                    }
                },
                "Variable": function (fwdstring){
                    var _match = fwdstring.match(new RegExp("^"+_lexer._variable));

                    if (!_match || fwdstring.substring(_match[0].length).match(/[^\s]/)){
                        _state = "Error";
                        return;
                    }
                    else {
                        var _var = _match[0];
                        _stack.push(["idem", "\""+_var+"\""]);
                        _state = "Accept";
                        return;
                    }
                },
                "AddOp": function (fwdstring, opindex){
                    var _left = fwdstring.substring(0, opindex);
                    var _right = fwdstring.substring(opindex + 1);

                    var optype;
                    if (fwdstring[opindex] == "+"){
                        optype = "plus";
                    }
                    else if (fwdstring[opindex] == "-"){
                        optype = "minus";
                    }
                    else {
                        _state = "Error";
                        return;
                    }

                    if (optype == "minus" && !_left.match(/[^\s]/)){
                        _stack.push(["times", [["idem", "-1"]], _parseString(_right)]);
                    }
                    else {
                        _stack.push([optype, _parseString(_left), _parseString(_right)]);
                    }

                    _state = "Accept";
                    return;
                },
                "MulOp": function (fwdstring, opindex){
                    var _left = fwdstring.substring(0, opindex);
                    var _right = fwdstring.substring(opindex + 1);

                    var optype;
                    if (fwdstring[opindex] == "*"){
                        optype = "times";
                    }
                    else if (fwdstring[opindex] == "/"){
                        optype = "div";
                    }
                    else {
                        _state = "Error";
                        return;
                    }

                    _stack.push([optype, _parseString(_left), _parseString(_right)]);
                    _state = "Accept";
                    return;
                },
                "PowOp": function (fwdstring, opindex){
                    var _left = fwdstring.substring(0, opindex);
                    var _right = fwdstring.substring(opindex + 1);

                    var optype;
                    if (fwdstring[opindex] == "^"){
                        optype = "pow";
                    }
                    else {
                        _state = "Error";
                        return;
                    }

                    _stack.push([optype, _parseString(_left), _parseString(_right)]);
                    _state = "Accept";
                    return;
                },
                "Group": function (fwdstring){
                    var _len = fwdstring.length;
                    var _ends = fwdstring.split('').reverse().join('').match(new RegExp("^[^"+_lexer._close+"]*"+_lexer._close));

                    if (!_ends || fwdstring.substring(_len - _ends[0].length + 1).match(/[^\s]/)){
                        _state = "Error";
                        return;
                    }
                    else {
                        var _inner = _parseString(fwdstring.substring(1, _len - _ends[0].length));
                        _stack.push(["Group", _inner]);
                        _state = "Accept";
                        return;
                    }
                },
                "FuncOp": function (fwdstring){
                    var _match;
                    var _inner;
                    var _len = fwdstring.length;
                    var _ends = fwdstring.split('').reverse().join('').match(new RegExp("^[^"+_lexer._close+"]*"+_lexer._close));

                    if (!_ends || fwdstring.substring(_len - _ends[0].length + 1).match(/[^\s]/)){
                        _state = "Error";
                        return;
                    }
                    else {
                        _match = fwdstring.match("^("+_lexer._function1+")"+_lexer._open);
                        if (_match){
                            _inner = fwdstring.substring(_match[0].length, _len - _ends[0].length);
                            _stack.push([_match[1], _parseString(_inner)]);
                            _state = "Accept";
                            return;
                        }
                        else {
                            _match = fwdstring.match("^("+_lexer._function2+")"+_lexer._open);
                            if (_match){
                                _inner = fwdstring.substring(_match[0].length, _len - _ends[0].length);
                                var mci = majorCommaIndex(_inner);
                                if (mci > -1){
                                    var _left = _inner.substring(0, mci);
                                    var _right = _inner.substring(mci + 1);

                                    _stack.push([_match[1], _parseString(_left), _parseString(_right)]);
                                    _state = "Accept";
                                    return;
                                }
                                else {
                                    _state = "Error";
                                    return;
                                }
                            }
                            else {
                                _state = "Error";
                                return;
                            }
                        }
                    }
                }
            };

            while(!_accepted && _pointer <= _strlen){
                _statefuncs[_state](str.substring(_pointer), _majoropindex);
            }
            
            return _stack;
        }

        function _parseStack(stack){
            var _res = "";

            stack.forEach(function (item){
                if (item[0] == "Group"){
                    _res += "("+_parseStack(item[1])+")";
                }
                else if (item.length > 2 || (item[1] && item[1] instanceof Array) ) {
                    _res += item[0]+"("+item.slice(1).map(function (arg){return _parseStack(arg);}).join(",")+")";
                }
                else if (item.length == 2) {
                    _res += item[0]+"("+item[1]+")";
                }
                else {
                    throw new _lexer.ParseError();
                }
            });

            return _res;
        }

        var _stack = _parseString(str, true);
        _result = _parseStack(_stack);

        if (stringrep){
            return _result;
        }
        else {
            return this.parseStringRep(_result);
        }
        
    },

    parseStringRep: function (stringrep){
        var _lexer = this;
        var _resultfunc = vm.runInNewContext(stringrep, this._calc);

        return function (values){
            if (typeof(values) != "object"){
                throw new _lexer.CalculationError("No values were provided");
            }
            else {
                return _resultfunc(values);
            }
        }
    },

    _calc: {
        idem: function (arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }
                
                return a1;
            }
        },
        plus: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 + a2;
            };
        }
        , minus: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 - a2;
            }
        }
        , times: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 * a2;
            }
        }
        , div: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 / a2;
            }
        }
        , log: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return Math.log(a1) / Math.log(a2)
            }
        }
        , ln: function (arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                return Math.log(a1);
            }
        }
        , pow: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return Math.pow(a1, a2);
            }
        }
        , exp: function (arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                return Math.exp(a1);
            }
        }
        , root: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return Math.pow(a1, 1 / a2);
            }
        }
        , sqrt: function (arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }
                return Math.sqrt(a1);
            }
        }
        , abs: function (arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                return Math.abs(a1);
            }
        }
    },

    parseStringRepLatex: function (stringrep){
        return (vm.runInNewContext(stringrep, this._calcLatex))[0];
    },

    _calcLatex: {
          idem: function(arg1){
            if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
            {
                return [""+parseFloat(arg1), "i"];
            }

            return ["\\text{"+arg1+"}", "i"];

        }
        , plus: function(arg1, arg2){
            var arg1t, arg2t;
            if (arg1[0] == "0" && arg2[0] == "0"){
                return ["0", "i"];
            }
            else if (arg1[0] == "0"){
                return arg2;
            }
            else if (arg2[0] == "0"){
                return arg1;
            }

            if (arg1[1] != "+" && arg1[1] != "-" && arg1[1] != "func" && arg1[1] != "i"){
                arg1t = "\\left("+arg1[0]+"\\right)"
            }
            else {
                arg1t = arg1[0];
            }

            if (arg2[1] != "+" && arg2[1] != "-" && arg2[1] != "func" && arg2[1] != "i"){
                arg2t = " + \\left("+arg2[0]+"\\right)";
            }
            else if (arg2[0][0] == "-"){
                arg2t = " - "+arg2[0].substring(1);
            }
            else {
                arg2t = " + "+arg2[0];
            }

            return [""+arg1t+arg2t, "+"];
        }
        , minus: function(arg1, arg2){
            var arg1t, arg2t;
            if (arg1[0] == "0" && arg2[0] == "0"){
                return ["0", "i"];
            }
            else if (arg1 == "0"){
                if (arg2[1] != "i" && arg2[1] != "func" && arg2[1] != "pow"){
                    return ["-\\left("+arg2[0]+"\\right)", "i"]
                }
                else if (arg2[0][0] == "-"){
                    return [arg2[0].substring(1), "i"];
                }

                return ["-"+arg2[0], "i"];
            }
            else if (arg2 == "0"){
                return arg1;
            }


            if (arg1[1] == "*"){
                arg1t = "\\left("+arg1[0]+"\\right)";
            }
            else {
                arg1t = arg1[0];
            }

            if (arg2[1] == "pow" || arg2[1] == "func"){
                arg2t = " - "+arg2[0];
            }
            else if (arg2[0][0] == "-"){
                arg2t = " + "+arg2[0].substring(1);
            }
            else {
                arg2t = " - \\left("+arg2[0]+"\\right)";
            }

            return [""+arg1t+arg2t, "-"];
        }
        , times: function(arg1, arg2){
            var arg1t, arg2t;

            if (arg1[0] == "-1"){
                if (arg2[1] != "i" && arg2[1] != "func" && arg2[1] != "pow"){
                    return ["-\\left("+arg2[0]+"\\right)", "i"]
                }
                else if(arg2[0][0] == "-"){
                    return [arg2.substring(1), "i"]
                }

                return ["-"+arg2[0], "i"];
            }
            else if (arg1[0] == "1"){
                return arg2;
            }
            else if (arg2[0] == "1"){
                return arg1;
            }

            if (arg1[1] == "+" || arg1[1] == "-"){
                arg1t = "\\left("+arg1[0]+"\\right)";
            }
            else {
                arg1t = arg1[0];
            }

            if (arg2[1] == "+" || arg2[1] == "-"){
                arg2t = "\\left("+arg2[0]+"\\right)";
            }
            else {
                arg2t = arg2[0];
            }

            return [arg1t+" \\cdot "+arg2t, "*"];

        }
        , div: function(arg1, arg2){
            if (arg2 == "1"){
                return arg1;
            }

            return ["\\frac{"+arg1[0]+"}{"+arg2[0]+"}", "func"];
        }
        , log: function(arg1, arg2){
            return ["\\log_{"+arg2[0]+"}\\left("+arg1[0]+"\\right)", "func"];
        }
        , ln: function(arg1){
            return ["\\ln\\left("+arg1[0]+"\\right)", "func"];
        }
        , pow: function(arg1, arg2){
            return ["\\left("+arg1[0]+"\\right)^{"+arg2[0]+"}", "pow"];
        }
        , exp: function(arg1){
            return ["e^{"+arg1[0]+"}", "pow"];
        }
        , root: function(arg1, arg2){
            return ["\\sqrt["+arg2[0]+"]{"+arg1[0]+"}", "func"];
        }
        , sqrt: function(arg1){
            return ["\\sqrt{"+arg1[0]+"}", "func"];
        }
        , abs: function(arg1){
            return ["\\left|"+arg1[0]+"\\right|", "func"];
        }
    },

    ParseError: function (msg){
        msg = msg || "Parse error";

        Error.call(this, msg);
        Error.captureStackTrace(this, arguments.callee);
    },

    CalculationError: function (msg){
        msg = msg || "Calculation error";

        Error.call(this, msg);
        Error.captureStackTrace(this, arguments.callee);
    }
};

sysutil.inherits(Lexer.ParseError, Error);
sysutil.inherits(Lexer.CalculationError, Error);