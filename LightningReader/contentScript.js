//Helper Methods

const isBeginTag = text => {
    if (text.substring(0, 1) === '<')
        return true

    return false
}

const isEndTag = text => {
    if (text.substring(text.length - 1) === '>')
        return true

    return false
}

const wrapTags = (text, element, className) => {
    return "<" + element + " class=" + className + ">" + text + "</" + element + ">";
}

//param wordList - takes an array
function rebuildString(wordList, splitChar) {
    var tempWordList = wordList;
    var retString = "";
    //undefined shows in the first index of sentence arrays for this char split. for some odd reason
    if (splitChar === '<' && tempWordList[0] === undefined) {
        tempWordList.shift();
    }
    tempWordList.forEach((word, indx) => {
        if (indx > 0) {
            retString += splitChar + word
        } else {
            var onlyEscapeRegex = /^(\\[^\r\n])*$/gm;
            if (onlyEscapeRegex.test(word) || isBeginTag(word)) {
                retString += word
            } else {
                retString += splitChar + word
            }
        }
        //retString += !isBeginTag(word) && indx > 0 ? splitChar + word : word;
    });
    retString.trimEnd();
    return retString;
}

//param wordList - takes an array
function rebuildEntityString(wordList, splitChar) {
    var tempWordList = wordList;
    var retString = "";
    //undefined shows in the first index of sentence arrays for this char split. for some odd reason
    if (tempWordList[0] === undefined) {
        tempWordList.shift();
    }
    tempWordList.forEach((word) => {
        if (word.indexOf(";") != -1) {
            retString += splitChar + word
        } else {

            retString += word

        }
    });
    retString.trimEnd();
    return retString;
}
const splitSentence = (text, splitChar) => {
    var arWords = text.split(splitChar);
    return arWords;
}

const isEscaped = text => {
    const regex = /^\t\n+$/;
    return regex.test(text);
}

//Function converts a word to bionic reading word
//takes a sentence as param and returns the first few characters bolded via html <b>
//example:  processWord('apple')
//returns:  <b>ap</b>pple 
const processWord = text => {
    const regex = /[A-Za-z0-9-_?.,"]+$/;
    const htmlEntityRegex = /&[a-z]+;/i;
    var start = 0;
    //console.log("processWord - begin")

    //console.log("processWord - text before process", text)
    //console.log("processWord - isEscaped:", isEscaped(text))

    // run first regex test to verify all characters are allowed (A-Z, a-z, 0-9, _, ?, period (.), and comma (,))
    if (regex.test(text)) {
        // second regex to confirm if text has html entities
        // &nbsp;, &lt;, &quot;, etc. 
        if (htmlEntityRegex.test(text)) {
            //console.log("Contains HTML Entity:", text)
            //example: " Civil&nbsp;rights"
            //split at the position of the &
            var splitEntityString = text.split("&");
            //console.log("Contains HTML Entity:", splitEntityString)
            var updatedEntityString = splitEntityString.map(word => {
                //console.log("Contains HTML Entity: indexof ;", word, word.indexOf(';'))
                var commaIndex = word.indexOf(';');
                var textSubString = "";

                //if no comma found the indexof returns -1
                //if no comma is found we can conclude we don't have to account for html entity
                if (commaIndex === -1) {
                    var retString = logicWrapTags(word, 0, 'b', 'chrm-ext-bold');
                    return retString
                } else {
                    //make sure the length fits
                    if (commaIndex < word.length) {
                        //add the begining of the string to the retun string
                        textSubString += word.substring(0, commaIndex + 1)
                        var retString = logicWrapTags(word.substring(commaIndex + 1), 0, 'b', 'chrm-ext-bold');
                        console.log("Contains HTML Entity:", " textSubstring: ", textSubString)
                        console.log("Contains HTML Entity:", " retstring: ", retString)
                        console.log("Contains HTML Entity:", " combined: ", textSubString + retString)
                        return textSubString + retString
                    }
                    return word
                }
            })

            return rebuildEntityString(updatedEntityString, "&")

        } else {
            //variable 'mid' determines how many characters in the word to bold
            // var mid = text.length > 5 ? ((text.length / 2)) : ((text.length / 2) + 1);
            // var boldChar = wrapTags(text.substring(start, (mid + start)), 'b', 'chrm-ext-bold');
            // console.log("processWord - end")
            // return boldChar + text.substring(mid)

            return logicWrapTags(text, start, 'b', 'chrm-ext-bold')
        }

    }
    //console.log("processWord - end")
    return text
}

function logicWrapTags(text, start, element, className) {
    //variable 'mid' determines how many characters in the word to bold
    var mid = text.length > 5 ? ((text.length / 2)) : ((text.length / 2) + 1);
    var boldChar = wrapTags(text.substring(start, (mid + start)), element, className);
    //console.log("processWord - end")
    return boldChar + text.substring(mid)
}

//Function converts all words in a sentence into bionic reading sentences html
const processSentence = sentence => {
    var arSplit = splitSentence(sentence, " ");

    const splitWords = arSplit.map(word => {
        return processWord(word)
    })

    return rebuildString(splitWords, " ");
}

// list of tags our process should ignore
const ignoreTags = ["noscript", "script", "style", "!--", "-->", "area", "base", "canvas", "code", "datalist", "data", "embed", "footer", "header", "map", "meta", "ruby", "svg", "title", "video"];

//get the substring for the beginning tag by the length of the sentence
//the max case we have to match has a length of 8 (datalist) and the smallest has a length of 3 (svg, map)
const getSubstringForTags = sentence => {

    if (sentence.length < 11 && sentence.length > 0) {
        return sentence.trimStart().substring(0, (sentence.length - 1))
    } else {
        return sentence.trimStart().substring(0, 10)
    }
}

//returns either null or the matched case
const matchFound = (sentence, list) => {
    var match = null;
    var count = 0;

    while (count < list.length && match === null) {

        if (getSubstringForTags(sentence).includes(list[count])) {
            match = list[count]
        }
        count++;
    }

    return match;
}

//Function that parses html input
//Returns a formatted version of all text within the html nodes
function convertBodyHTMLToBionic(words, splitChar, catchChar) {
    //console.log('Words - Before Split:', words);
    var arWords = splitSentence(words, splitChar);
    //console.log('Words - after Split:', words);

    // variable to hold the value of an html tag that our process should ignore. 
    // This will be used to match the current opening tag w/ the previously captured tag
    // if null then you are not currently inside a tag
    var currentMatch = null;

    const newWords = arWords.map(word => {

        //check if current word is greater than 2 characters
        if (word.length > 2) {

            console.log('word before processing', word)
            var endTag = word.indexOf(catchChar);
            console.log('EndTag > word', endTag)
            var useSub = false;
            var txtafter = null;
            var txtbefore = null;

            //if currentMatch != null, then we are currently in a tag
            //etc. /script>, /style>, /svg>, comment (!--)
            if (currentMatch != null) {
                //check the beginning of this line to for an ignored tag
                var currentTag = matchFound(word, ignoreTags)

                //if current tag finds a match in our ignore list
                if (currentTag != null) {
                    //check if current tag doesn't equal our previous match
                    //return this line untouched and move to the next
                    if (currentTag != currentMatch) {
                        //special case
                        //if we are in a comment tag, then find the end tag
                        //<!-- example of a comment -->
                        if (currentTag === '!--' & currentMatch === '-->') {
                            currentMatch = null;
                        }
                        return word
                    } else {
                        //current tag finds a match and it equals our previous match
                        //then return this line untouched and remove our 'currentMatch' flag
                        //move to next line
                        currentMatch = null;
                        return word
                    }
                }
            } else {
                //if currentMatch is null, then check the new line for a matching case
                var currentTag = matchFound(word, ignoreTags)

                //if a match is found for an ignore tag, then set our currentMatch flag
                //return this line untouched 
                if (currentTag != null) {
                    currentMatch = currentTag
                    return word
                }
            }


            //check if the last character in the string is a '>'
            //this signifies that this word is the end of a tag
            //example: ol>, class="d-none" name="exampleAttri">, img src="..." />
            //console.log("isEndTag > word:", word, "word.trimEnd: ", word.trimEnd());
            if (isEndTag(word.trimEnd())) {
                return word
            }

            //check if there is a '>' character in the string 
            //create a substring from the characters after
            //example input: 'a href=\"/shopping-tools/a/26/\">Shopping Tools'
            //return:         'Shopping Tools'

            if (endTag >= 0) {//indexOf returns -1 if not found
                txtafter = word.substring(endTag + 1);
                txtbefore = word.substring(0, endTag + 1);
                useSub = true;
                if (txtafter.length < 3) {
                    return word;
                }
            }

            //console.log('word: ', useSub ? txtafter : word);
            var retString = useSub ? (txtbefore + processSentence(txtafter)) : (processSentence(word));
            //console.log('word after processing <retString>', retString)
            return retString;

        } else {
            return word
        }

    });
    console.log('Ran', newWords)
    console.log('Rebuild String', rebuildString(newWords, '<'))
    return rebuildString(newWords, '<')

}

function appendDivToBody(html, css, element) {
    var div = document.createElement(element);
    div.style.cssText = 'postion:absolute;top:0;left:0;width:100vw;height:100vh; z-index:3000; background-color: white; color: black'
    document.body.appendChild(div);
    div.innerHTML = html;
}

//Function that parses html input
//Returns a formatted version of all text within the html nodes
function convertHTMLToBionic(words, splitChar, catchChar) {
    console.log('Words - Before Split:', words);
    var arWords = splitSentence(words, splitChar);
    console.log('Words - after Split:', words);
    var closeTag = "";

    const newWords = arWords.map(word => {

        console.log('word before processing', word)
        var endTag = word.indexOf(catchChar);
        console.log('EndTag > word', endTag)
        var useSub = false;
        var txtafter = null;
        var txtbefore = null;

        //check if the last character in the string is a '>'
        //this signifies that this word is the end of a tag
        //example: ol>, class="d-none" name="exampleAttri">, img src="..." />
        console.log("isEndTag > word:", word, "word.trimEnd: ", word.trimEnd());
        if (isEndTag(word.trimEnd())) {
            return word
        }

        //check if current word is greater than 2 characters
        if (word.length > 2) {

            //check if there is a '>' character in the string 
            //create a substring from the characters after
            //example input: 'a href=\"/shopping-tools/a/26/\">Shopping Tools'
            //return:         'Shopping Tools'

            if (endTag >= 0) {//indexOf returns -1 if not found
                txtafter = word.substring(endTag + 1);
                txtbefore = word.substring(0, endTag + 1);
                useSub = true;
                if (txtafter.length < 3) {
                    return word;
                }
            }

            //console.log('word: ', useSub ? txtafter : word);
            var retString = useSub ? (txtbefore + processSentence(txtafter)) : (processSentence(word));
            console.log('word after processing <retString>', retString)
            return retString;

        }

    });
    //console.log('Ran', newWords)
    //console.log('Rebuild String', rebuildString(newWords, '<'))
    return rebuildString(newWords, '<')

}

function convertCollectionToBionic(collection, splitChar, catchChar) {
    for (x = 0; x < collection.length; x++) {
        collection[x].innerHTML = convertHTMLToBionic(collection[x].innerHTML, "<", ">");
    }
}

/*
######################
#
#   Main Code Block
#
######################
*/

var convertedHTML = convertBodyHTMLToBionic(document.body.innerHTML, "<", ">");

document.body.innerHTML = convertedHTML;












