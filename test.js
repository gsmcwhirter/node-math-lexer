//uses nodeunit
var mlexer = require("./index");

exports["emptystring"] = function (test){
    test["throws"](function (){mlexer.parseString("")}, mlexer.ParseError, "test1");
    test["throws"](function (){mlexer.parseString({})}, mlexer.ParseError, "test2");
    test["throws"](function (){mlexer.parseString([])}, mlexer.ParseError, "test3");
    test["throws"](function (){mlexer.parseString(null)}, mlexer.ParseError, "test4");
    test["throws"](function (){mlexer.parseString()}, mlexer.ParseError, "test5");
    test["throws"](function (){mlexer.parseString(true)}, mlexer.ParseError, "test6");
    test["throws"](function (){mlexer.parseString(" ")}, mlexer.ParseError, "test7");
    test["throws"](function (){mlexer.parseString(" \n ")}, mlexer.ParseError, "test8");

    test.done();
}

exports["string-output"] = function (test){
    var test1 = function (){return mlexer.parseString("2", true)};
    var test2 = function (){return mlexer.parseString("ab1", true)};
    var test3 = function (){return mlexer.parseString("3 + a - 2", true)};
    var test4 = function (){return mlexer.parseString(" 3 + a * 2", true)};

    test.doesNotThrow(test1, mlexer.ParseError, "test1");
    test.doesNotThrow(test2, mlexer.ParseError, "test2");
    test.doesNotThrow(test3, mlexer.ParseError, "test3");
    test.doesNotThrow(test4, mlexer.ParseError, "test4");

    test.equals(typeof test1(), "string", "test1");
    test.equals(typeof test2(), "string", "test2");
    test.equals(typeof test3(), "string", "test3");
    test.equals(typeof test4(), "string", "test4");

    test.equals(test1(), "idem(2)", "test1");
    test.equals(test2(), "idem(\"ab1\")", "test2");
    test.equals(test3(), "minus(plus(idem(3),idem(\"a\")),idem(2))", "test3");
    test.equals(test4(), "plus(idem(3),times(idem(\"a\"),idem(2)))", "test4");

    test.done();
}

exports["ok-number"] = function (test){
    var test1 = function (){return mlexer.parseString("2")};
    var test2 = function (){return mlexer.parseString("2.1")};
    var test3 = function (){return mlexer.parseString(".1")};
    var test4 = function (){return mlexer.parseString(" 2")};
    var test5 = function (){return mlexer.parseString("2 ")};
    var test6 = function (){return mlexer.parseString(" 2 ")};

    test.doesNotThrow(test1, mlexer.ParseError, "test1");
    test.doesNotThrow(test2, mlexer.ParseError, "test2");
    test.doesNotThrow(test3, mlexer.ParseError, "test3");
    test.doesNotThrow(test4, mlexer.ParseError, "test4");
    test.doesNotThrow(test5, mlexer.ParseError, "test5");
    test.doesNotThrow(test6, mlexer.ParseError, "test6");

    test.equals(typeof test1(), "function");
    test.equals(typeof test2(), "function");
    test.equals(typeof test3(), "function");
    test.equals(typeof test4(), "function");
    test.equals(typeof test5(), "function");
    test.equals(typeof test6(), "function");

    test["throws"](function (){test1()()}, mlexer.CalculationError);
    test["throws"](function (){test2()()}, mlexer.CalculationError);
    test["throws"](function (){test3()()}, mlexer.CalculationError);
    test["throws"](function (){test4()()}, mlexer.CalculationError);
    test["throws"](function (){test5()()}, mlexer.CalculationError);
    test["throws"](function (){test6()()}, mlexer.CalculationError);

    test.equals(test1()({}), 2);
    test.equals(test2()({}), 2.1);
    test.equals(test3()({}), 0.1);
    test.equals(test4()({}), 2);
    test.equals(test5()({}), 2);
    test.equals(test6()({}), 2);

    test.equals(test1()({a: 1}), 2);
    test.equals(test2()({b: 2}), 2.1);
    test.equals(test3()({c: 3}), 0.1);
    test.equals(test4()({d: 4}), 2);
    test.equals(test5()({e: 5}), 2);
    test.equals(test6()({f: 6}), 2);

    test.done();
}

exports["bad-number"] = function (test){
    var test1 = function (){return mlexer.parseString("2 .1")};
    var test2 = function (){return mlexer.parseString("2. 1")};
    var test3 = function (){return mlexer.parseString("2 1")};
    var test4 = function (){return mlexer.parseString("2.1.2")};

    test["throws"](test1, mlexer.ParseError);
    test["throws"](test2, mlexer.ParseError);
    test["throws"](test3, mlexer.ParseError);
    test["throws"](test4, mlexer.ParseError);

    test.done();
}

exports["ok-variable"] = function (test){
    var test1 = function (){return mlexer.parseString("a")};
    var test2 = function (){return mlexer.parseString("ab1")};
    var test3 = function (){return mlexer.parseString("a1b")};
    var test4 = function (){return mlexer.parseString(" ab1")};
    var test5 = function (){return mlexer.parseString("ab1 ")};
    var test6 = function (){return mlexer.parseString(" ab1 ")};

    test.doesNotThrow(test1, mlexer.ParseError);
    test.doesNotThrow(test2, mlexer.ParseError);
    test.doesNotThrow(test3, mlexer.ParseError);
    test.doesNotThrow(test4, mlexer.ParseError);
    test.doesNotThrow(test5, mlexer.ParseError);
    test.doesNotThrow(test6, mlexer.ParseError);

    test.equals(typeof test1(), "function");
    test.equals(typeof test2(), "function");
    test.equals(typeof test3(), "function");
    test.equals(typeof test4(), "function");
    test.equals(typeof test5(), "function");
    test.equals(typeof test6(), "function");

    test["throws"](function (){test1()()}, mlexer.CalculationError);
    test["throws"](function (){test2()()}, mlexer.CalculationError);
    test["throws"](function (){test3()()}, mlexer.CalculationError);
    test["throws"](function (){test4()()}, mlexer.CalculationError);
    test["throws"](function (){test5()()}, mlexer.CalculationError);
    test["throws"](function (){test6()()}, mlexer.CalculationError);

    test.equals(test1()({a: 2}), 2);
    test.equals(test2()({ab1: 2.1}), 2.1);
    test.equals(test3()({a1b: 3}),3);
    test.equals(test4()({ab1: 4}), 4);
    test.equals(test5()({ab1: 5}), 5);
    test.equals(test6()({ab1: 6}), 6);

    test.ok(isNaN(test1()({})));
    test.ok(isNaN(test2()({a: 1})));
    test.ok(isNaN(test3()({b: 1})));
    test.ok(isNaN(test4()({c: 1})));
    test.ok(isNaN(test5()({d: 1})));
    test.ok(isNaN(test6()({e: 1})));

    test.done();
}

exports["bad-variable"] = function (test){
    var test1 = function (){return mlexer.parseString("2abc2")};
    var test2 = function (){return mlexer.parseString("ab c")};
    var test3 = function (){return mlexer.parseString("ab.c")};
    var test4 = function (){return mlexer.parseString("2.1a")};

    test["throws"](test1, mlexer.ParseError);
    test["throws"](test2, mlexer.ParseError);
    test["throws"](test3, mlexer.ParseError);
    test["throws"](test4, mlexer.ParseError);

    test.done();
}

exports["ok-group"] = function (test){
    var test1 = function (){return mlexer.parseString("(2)")};
    var test2 = function (){return mlexer.parseString("((a))")};
    var test3 = function (){return mlexer.parseString("((a) ) ")};

    test.doesNotThrow(test1, mlexer.ParseError);
    test.doesNotThrow(test2, mlexer.ParseError);
    test.doesNotThrow(test3, mlexer.ParseError);

    test.equals(typeof test1(), "function");
    test.equals(typeof test2(), "function");
    test.equals(typeof test3(), "function");

    test["throws"](function (){test1()()}, mlexer.CalculationError);
    test["throws"](function (){test2()()}, mlexer.CalculationError);
    test["throws"](function (){test3()()}, mlexer.CalculationError);

    test.equals(test1()({}), 2);
    test.equals(test2()({a: 2.1}), 2.1);
    test.equals(test3()({a: 2.1}), 2.1);
    
    test.ok(isNaN(test2()({b: 1})));

    test.done();
}

exports["bad-group"] = function (test){
    var test1 = function (){return mlexer.parseString("(2")};
    var test2 = function (){return mlexer.parseString("(a))")};

    test["throws"](test1, mlexer.ParseError);
    test["throws"](test2, mlexer.ParseError);

    test.done();
}

exports["ok-plus-minus"] = function (test){
    var test1 = function (){return mlexer.parseString("2 + 1.")};
    var test2 = function (){return mlexer.parseString("(3 + a)")};
    var test3 = function (){return mlexer.parseString("3 + a - 2")};
    var test4 = function (){return mlexer.parseString(" (3 + a) + 2")};

    test.doesNotThrow(test1, mlexer.ParseError);
    test.doesNotThrow(test2, mlexer.ParseError);
    test.doesNotThrow(test3, mlexer.ParseError);
    test.doesNotThrow(test4, mlexer.ParseError);

    test.equals(typeof test1(), "function");
    test.equals(typeof test2(), "function");
    test.equals(typeof test3(), "function");
    test.equals(typeof test4(), "function");

    test["throws"](function (){test1()()}, mlexer.CalculationError);
    test["throws"](function (){test2()()}, mlexer.CalculationError);
    test["throws"](function (){test3()()}, mlexer.CalculationError);
    test["throws"](function (){test4()()}, mlexer.CalculationError);

    test.equals(test1()({}), 3.);
    test.equals(test2()({a: 2.}), 5.);
    test.equals(test3()({a: 2.}), 3.);
    test.equals(test4()({a: 2.}), 7.);

    test.done();
}

exports["bad-plus-minus"] = function (test){
    var test1 = function (){return mlexer.parseString("2 + 2 +")};
    var test2 = function (){return mlexer.parseString("+ 2")};
    var test3 = function (){return mlexer.parseString("2 + + 2")};
    var test4 = function (){return mlexer.parseString("2a + 1")};

    test["throws"](test1, mlexer.ParseError);
    test["throws"](test2, mlexer.ParseError);
    test["throws"](test3, mlexer.ParseError);
    test["throws"](test4, mlexer.ParseError);

    test.done();
}

exports["ok-mult-div"] = function (test){
    var test1 = function (){return mlexer.parseString("2 * 1.")};
    var test2 = function (){return mlexer.parseString("(3 / a)")};
    var test3 = function (){return mlexer.parseString("3 / a * 2")};
    var test4 = function (){return mlexer.parseString(" 3 / (a * 2)")};
    var test5 = function (){return mlexer.parseString(" 3 + a * 2")};

    test.doesNotThrow(test1, mlexer.ParseError);
    test.doesNotThrow(test2, mlexer.ParseError);
    test.doesNotThrow(test3, mlexer.ParseError);
    test.doesNotThrow(test4, mlexer.ParseError);

    test.equals(typeof test1(), "function");
    test.equals(typeof test2(), "function");
    test.equals(typeof test3(), "function");
    test.equals(typeof test4(), "function");
    test.equals(typeof test5(), "function");

    test["throws"](function (){test1()()}, mlexer.CalculationError);
    test["throws"](function (){test2()()}, mlexer.CalculationError);
    test["throws"](function (){test3()()}, mlexer.CalculationError);
    test["throws"](function (){test4()()}, mlexer.CalculationError);
    test["throws"](function (){test5()()}, mlexer.CalculationError);

    test.equals(test1()({}), 2.);
    test.equals(test2()({a: 2.}), 1.5);
    test.equals(test3()({a: 3.}), 2.);
    test.equals(test4()({a: 3.}), 0.5);
    test.equals(test5()({a: 3.}), 9.);

    test.done();
}

exports["bad-mult-div"] = function (test){
    var test1 = function (){return mlexer.parseString("2 * 2 /")};
    var test2 = function (){return mlexer.parseString("/ 2")};
    var test3 = function (){return mlexer.parseString("2 ** 2")};
    var test4 = function (){return mlexer.parseString("2a / 1")};

    test["throws"](test1, mlexer.ParseError);
    test["throws"](test2, mlexer.ParseError);
    test["throws"](test3, mlexer.ParseError);
    test["throws"](test4, mlexer.ParseError);

    test.done();
}

exports["ok-pow"] = function (test){
    var test1 = function (){return mlexer.parseString("2 ^ 1.")};
    var test2 = function (){return mlexer.parseString("(3 ^ a)")};
    var test3 = function (){return mlexer.parseString("(3 ^ 3) ^ a")};
    var test4 = function (){return mlexer.parseString(" 3 ^ (3 ^ a)")};
    var test5 = function (){return mlexer.parseString(" 3 + 3 ^ a")};
    var test6 = function (){return mlexer.parseString("3 * x^2 * y + 5")};

    test.doesNotThrow(test1, mlexer.ParseError);
    test.doesNotThrow(test2, mlexer.ParseError);
    test.doesNotThrow(test3, mlexer.ParseError);
    test.doesNotThrow(test4, mlexer.ParseError);
    test.doesNotThrow(test5, mlexer.ParseError);
    test.doesNotThrow(test6, mlexer.ParseError);

    test.equals(typeof test1(), "function");
    test.equals(typeof test2(), "function");
    test.equals(typeof test3(), "function");
    test.equals(typeof test4(), "function");
    test.equals(typeof test5(), "function");
    test.equals(typeof test6(), "function");

    test["throws"](function (){test1()()}, mlexer.CalculationError);
    test["throws"](function (){test2()()}, mlexer.CalculationError);
    test["throws"](function (){test3()()}, mlexer.CalculationError);
    test["throws"](function (){test4()()}, mlexer.CalculationError);
    test["throws"](function (){test5()()}, mlexer.CalculationError);
    test["throws"](function (){test6()()}, mlexer.CalculationError);

    test.equals(test1()({}), 2.);
    test.equals(test2()({a: 2.}), 9.);
    test.equals(test3()({a: 2.}), 729.);
    test.equals(test4()({a: 2.}), 19683.);
    test.equals(test5()({a: 2.}), 12.);
    test.equals(test6()({x: 2., y: 1.}), 17.);

    test.done();
}

exports["bad-pow"] = function (test){
    var test1 = function (){return mlexer.parseString("2 ^ 2 ^")};
    var test2 = function (){return mlexer.parseString("^ 2")};
    var test3 = function (){return mlexer.parseString("2 ^^ 2")};
    var test4 = function (){return mlexer.parseString("2 ^ 3 ^ 1")};

    test["throws"](test1, mlexer.ParseError);
    test["throws"](test2, mlexer.ParseError);
    test["throws"](test3, mlexer.ParseError);
    test["throws"](test4, mlexer.ParseError);

    test.done();
}

exports["ok-func1"] = function (test){
    var tests = [
        [function (){return mlexer.parseString("exp(ln(2) + ln(2))")}, 4],
        [function (){return mlexer.parseString("sqrt(16)")}, 4],
        [function (){return mlexer.parseString("abs(1 - 3)")}, 2],
        [function (){return mlexer.parseString("ln( exp(4) )")}, 4]
    ];

    test.doesNotThrow(tests[0][0], mlexer.ParseError, "test1");
    test.equals(typeof tests[0][0](), "function", "test1");
    test["throws"](function (){tests[0][0]()()}, mlexer.CalculationError, "test1");
    test.equals(tests[0][0]()(tests[0][2] || {}), tests[0][1], "test1");

    test.doesNotThrow(tests[1][0], mlexer.ParseError, "test2");
    test.equals(typeof tests[1][0](), "function", "test2");
    test["throws"](function (){tests[1][0]()()}, mlexer.CalculationError, "test2");
    test.equals(tests[1][0]()(tests[1][2] || {}), tests[1][1], "test2");

    test.doesNotThrow(tests[2][0], mlexer.ParseError, "test3");
    test.equals(typeof tests[2][0](), "function", "test3");
    test["throws"](function (){tests[2][0]()()}, mlexer.CalculationError, "test3");
    test.equals(tests[2][0]()(tests[2][2] || {}), tests[2][1], "test3");

    test.doesNotThrow(tests[3][0], mlexer.ParseError, "test4");
    test.equals(typeof tests[3][0](), "function", "test4");
    test["throws"](function (){tests[3][0]()()}, mlexer.CalculationError, "test4");
    test.equals(tests[3][0]()(tests[3][2] || {}), tests[3][1], "test4");

    test.done();
}

exports["bad-func-1"] = function (test){
    test.done();
}

exports["ok-func2"] = function (test){
    var tests = [
        [function (){return mlexer.parseString("log(exp(ln(2) + ln(2)), 2)")}, 2],
        [function (){return mlexer.parseString("root(sqrt(64), 3)")}, 2],
        [function (){return mlexer.parseString("3 * x^2 * y + 5 / (log(2 ^ (x / 2), 2) + 3 + abs(y^3))")}, -11, {x: 2, y: -1}],
        [function (){return mlexer.parseString("3 * x^2 * y + 5 / (log(2 ^ (x / 2), 2) + 3 + abs(y^3))")}, 13, {x: 2, y: 1}],
    ];

    test.doesNotThrow(tests[0][0], mlexer.ParseError, "test1");
    test.equals(typeof tests[0][0](), "function", "test1");
    test["throws"](function (){tests[0][0]()()}, mlexer.CalculationError, "test1");
    test.equals(tests[0][0]()(tests[0][2] || {}), tests[0][1], "test1");

    test.doesNotThrow(tests[1][0], mlexer.ParseError, "test2");
    test.equals(typeof tests[1][0](), "function", "test2");
    test["throws"](function (){tests[1][0]()()}, mlexer.CalculationError, "test2");
    test.equals(tests[1][0]()(tests[1][2] || {}), tests[1][1], "test2");

    test.done();
}

exports["bad-func-2"] = function (test){
    test.done();
}

exports["negative-numbers"] = function (test){
    var test1 = function (){return mlexer.parseString("-1")};
    var test2 = function (){return mlexer.parseString("-(a + 3)")};
    var test3 = function (){return mlexer.parseString("(-a + 3)")};
    var test4 = function (){return mlexer.parseString("2 * b + -0.5 * a")};
    var test5 = function (){return mlexer.parseString("2 * -3 + (1/9)^-0.5")};

    test.doesNotThrow(test1, mlexer.ParseError);
    test.doesNotThrow(test2, mlexer.ParseError);
    test.doesNotThrow(test3, mlexer.ParseError);
    test.doesNotThrow(test4, mlexer.ParseError);
    test.doesNotThrow(test5, mlexer.ParseError);

    test.equals(typeof test1(), "function", "test1");
    test.equals(typeof test2(), "function", "test2");
    test.equals(typeof test3(), "function", "test3");
    test.equals(typeof test4(), "function", "test4");
    test.equals(typeof test5(), "function", "test5");

    test["throws"](function(){test1()()}, mlexer.CalculationError, "test1");
    test["throws"](function(){test2()()}, mlexer.CalculationError, "test2");
    test["throws"](function(){test3()()}, mlexer.CalculationError, "test3");
    test["throws"](function(){test4()()}, mlexer.CalculationError, "test4");
    test["throws"](function(){test5()()}, mlexer.CalculationError, "test5");

    test.equals(test1()({a: 1}), -1, "test1");
    test.equals(test2()({a: 1}), -4, "test2");
    test.equals(test3()({a: 1}), 2, "test3");
    test.equals(test4()({a: 2, b: 1}), 1, "test4");
    test.equals(test5()({}), -3, "test5");

    test.done();
}

exports["strings and latex"] = function (test){
    var test1 = function (){return mlexer.parseString("-1", true)};
    var test2 = function (){return mlexer.parseString("-(a + 3)", true)};
    var test3 = function (){return mlexer.parseString("(-a + 3)", true)};
    var test4 = function (){return mlexer.parseString("2 * b + -0.5 * a", true)};
    var test5 = function (){return mlexer.parseString("2 * -3 + (1/9)^-0.5", true)};

    test.doesNotThrow(test1, mlexer.ParseError);
    test.doesNotThrow(test2, mlexer.ParseError);
    test.doesNotThrow(test3, mlexer.ParseError);
    test.doesNotThrow(test4, mlexer.ParseError);
    test.doesNotThrow(test5, mlexer.ParseError);

    test.equals(typeof test1(), "string", "test1");
    test.equals(typeof test2(), "string", "test2");
    test.equals(typeof test3(), "string", "test3");
    test.equals(typeof test4(), "string", "test4");
    test.equals(typeof test5(), "string", "test5");

    test.equals(test1(), "times(idem(-1),idem(1))", "test1");
    test.equals(test2(), "times(idem(-1),(plus(idem(\"a\"),idem(3))))", "test2");
    test.equals(test3(), "(plus(times(idem(-1),idem(\"a\")),idem(3)))", "test3");
    test.equals(test4(), "plus(times(idem(2),idem(\"b\")),times(idem(-1),times(idem(0.5),idem(\"a\"))))");
    test.equals(test5(), "plus(times(idem(2),times(idem(-1),idem(3))),pow((div(idem(1),idem(9))),times(idem(-1),idem(0.5))))", "test5");

    test.equals(mlexer.parseStringRepLatex(test1()), "-1", "test1");
    test.equals(mlexer.parseStringRepLatex(test2()), "-\\left(\\text{a} + 3\\right)", "test2");
    test.equals(mlexer.parseStringRepLatex(test3()), "-\\text{a} + 3", "test3");
    test.equals(mlexer.parseStringRepLatex(test4()), "\\left(2 \\cdot \\text{b}\\right) - \\left(0.5 \\cdot \\text{a}\\right)", "test4");
    test.equals(mlexer.parseStringRepLatex(test5()), "\\left(2 \\cdot -3\\right) + \\left(\\left(\\frac{1}{9}\\right)^{-0.5}\\right)", "test5");
    test.equals(mlexer.parseStringRepLatex("plus(plus(plus(times(idem(1.5),idem(\"kills\")),times(idem(-1),times(idem(0.5),idem(\"deaths\")))),times(idem(1),idem(\"wins\"))),times(idem(-1),times(idem(0.25),idem(\"losses\"))))"), "\\left(1.5 \\cdot \\text{kills}\\right) - \\left(0.5 \\cdot \\text{deaths}\\right) + \\text{wins} - \\left(0.25 \\cdot \\text{losses}\\right)", "test6")

    test.done();
}