# node-math-lexer

## Description

This package parses basic mathematical formulae including variables into functions
that will accept variable values and calculate results.

## Installation

You can install this through npm:
    
    npm install math-lexer
    
##Usage

    var sysutil = require('util');
    var mlexer = require('math-lexer');
    var func = "3 * x^2 * y + 5 / (log(2 ^ (x / 2), 2) + 3 + abs(y^3))";
    var realfunc = mlexer.parseString(func);

    sysutil.puts(realfunc({x: 2, y: -1}));
    //=> -11
    sysutil.puts(realfunc({x: 2, y: 1}));
    //=> 13

## Language

- Addition: a + b
- Subtraction: a - b
- Multiplication: a * b
- Division: a / b
- Exponentiation: a ^ b
- Exponentiation: exp(a)
- Natural Logarithm: ln(a)
- Logarithm: log(a, b) [b is the base]
- Absolute Value: abs(a)
- Square Root: sqrt(a)
- N-th Root: root(a, b) [b is the root degree]

## Tests

Tests that exist are written for Nodeunit.
To run them, install nodeunit and then run

    nodeunit test.js
