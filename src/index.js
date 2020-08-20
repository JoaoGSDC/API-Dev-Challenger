const fs = require('fs');
const csvToJson = require('csvtojson');
const { head } = require('lodash');

var _ = require('lodash');

const testArray = [];
// -------- TRÁS UM JSON PRONTO COM ESTRUTURA DEFAULT
/* csvToJson({checkColumn: true}).fromFile('src/input.csv')
    .then((input) => {
        input.map(inpt => {
            inpt.class = inpt.class.split(',');

            let classes = [];
            inpt.class.map(clss => classes.push(clss.trim()));
            inpt.class = classes;

            inpt.invisible = inpt.invisible === '1' ? true : false;
            inpt.see_all = inpt.see_all === 'yes' ? true : false;
        });
        fs.writeFileSync('output.json', JSON.stringify(input, null, 4));
    })
    .catch(err => console.log(err)); */

// -------- TRÁS UM ARRAY DO CSV SEM HEADERS
csvToJson({ noheader: true, output: 'csv' }).fromFile('src/input.csv')
    .then((input) => {
        fs.writeFileSync('output.json', JSON.stringify(input, null, 4));
    })
    .catch(err => console.log(err));

const outputJson = JSON.parse(fs.readFileSync('output.json'));
var headers = outputJson[0];
var params = outputJson.splice(1);

let arrayAddresses = [];

function toObj(params) {
    return params.reduce((parameter, component, i) => {
        /* const count = _.countBy(headers)['class'];
        console.log(count); */
        if (i > 0) {
            if (headers[i] === headers[i - 1]) {
                return setToArrayEqualHeader(headers, parameter, component, i);
            }
        }

        
        const emailOrPhone = headers[i].split(' ')[0];
        if (emailOrPhone === 'email' || emailOrPhone === 'phone') {
            const addresses = headers[i].split(' ');

            let address = component.replace(':', '').replace('(', '').replace(')', '').replace(' ', '');
            let arr = address.split('/');

            const oAddress = {
                type: emailOrPhone,
                tags: addresses.splice(1).map(address => address = address.split(',').join('')),
                address,
            }
            
            if (arr.length > 1) {
                for (let oArr of arr) {
                    oAddress.address = oArr;
                    console.log(oAddress);
                    arrayAddresses.push(oAddress);
                }
            } else {
                arrayAddresses.push(oAddress);
            }

            parameter['addresses'] = arrayAddresses;
            
            return parameter;
        }
        
        arrayAddresses = [];
        
        if (headers[i] === 'invisible' || headers[i] === 'see_all') {
            parameter[headers[i]] = setBooleanValueToHeader(component);
            return parameter;
        }
        parameter[headers[i]] = component;
        return parameter;
    }, {});
}

var out = params.map(toObj);

fs.writeFileSync('teste.json', JSON.stringify(out, null, 4));

// console.log(out);

// --------------------------
// ---> FUNÇÕES AUXILIARES

function setToArrayEqualHeader(headers, parameter, component, i) {
    if (component !== '') {
        parameter[headers[i]] = `${parameter[headers[i]]}/${component}`;
    }
    parameter[headers[i]] = parameter[headers[i]].replace(', ', '/').replace(' / ', '/').split('/').sort();

    return parameter;
}

function setBooleanValueToHeader(component) {
    return component == 1 || component === 'yes' ? true : false;
}