#!/usr/bin/env node
const commandLineArgs = require("command-line-args")
const jsTokens = require("js-tokens")
const fs = require("fs");
const { exit } = require("process");
const pjson = require('../package.json');

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function trim(s, c) {
    if (c === "]") c = "\\]";
    if (c === "^") c = "\\^";
    if (c === "\\") c = "\\\\";
    return s.replace(new RegExp(
        "^[" + c + "]+|[" + c + "]+$", "g"
    ), "");
}

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

function printError(message) {
    let emojis = ["🤨", "😐", "😑", "😒", "🙄", "😬", "🤮", "🤡", "🙈", "😾"]
    let e = emojis[getRandomInt(emojis.length - 1)]
    console.error(e + ": " + message)
}

function ex(c) {
    console.log()
    console.log("Simply on chillo 🤙")
    exit(c)
}

function ensureFileArray(fileArray, dir) {
    let files = fileArray || fs.readdirSync(dir)
    let outputArr = []
    for (f of files) {
        if (fs.statSync((dir ? dir + "/" : "") + f).isDirectory()) {
            outputArr = outputArr.concat(ensureFileArray(undefined, (dir ? dir + "/" : "") + f))
        } else {
            outputArr.push((dir ? dir + "/" : "") + f)
        }
    }
    return outputArr
}

/* Creates a uppercase hex number with at least length digits from a given number */
function fixedHex(number, length) {
    let str = number.toString(16).toUpperCase();
    while (str.length < length)
        str = "0" + str;
    return str;
}

/* Creates a unicode literal based on the string */
function generateIdentifier(str) {
    let i;
    let result = "";
    for (i = 0; i < str.length; ++i) {
        /* You should probably replace this by an isASCII test */
        if (str.charCodeAt(i) > 126 || str.charCodeAt(i) < 32)
            result += "chilloscript_" + fixedHex(str.charCodeAt(i), 4);
        else
            result += str[i];
    }

    return result;
}

function transpile(code, file) {
    let out = ""
    for (const token of jsTokens(code)) {
        if (token.type === "IdentifierName" && token.value.indexOf("chilloscript") >= 0) {
            throw new Error("Identifier " + token.value + " in " + file + " can not contain reserved word 'chilloscript'");
        }
        out += token.type === "Invalid" ? generateIdentifier(token.value) : token.value
    }
    return out
}

const optionDefinitions = [
    /*{ name: "watch", alias: "w", type: Boolean },
    { name: "copyOthers", alias: "cp", type: Boolean },*/
    { name: "outDir", alias: "o", type: String },
    { name: "src", alias: "s", type: String, multiple: true }
]

console.log("chilloscript v" + pjson.version + " 🤙")
console.log()

const options = commandLineArgs(optionDefinitions)

if (!options.src) {
    printError("No source file or directory was specified")
    ex(1)
}



try {
    let files = ensureFileArray(options.src)
    for (file of files) {
        if (file.indexOf(".🤙") < 0) {
            continue;
        };
        let contents = fs.readFileSync(file).toString()
        let newFn = file.replace(".🤙", ".js")
        let destination = options.outDir ? trim(options.outDir, "/") + newFn.substring(getPosition(newFn, "/", (newFn.startsWith(".") || newFn.startsWith("/")) ? 2 : 1)) : newFn;
        fs.mkdirSync(destination.substring(0, destination.lastIndexOf("/")), { recursive: true });
        let transpiled = transpile(contents, file)
        fs.writeFileSync(destination, transpiled);
    }
} catch (e) {
    printError(e.message)
}

ex(0)