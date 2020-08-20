const fs = require('fs');
const csvToJson = require('csvtojson');

csvToJson({ noheader: true, output: 'csv' })
    .fromFile('src/input.csv')
    .then(input => createJson(input))
    .catch(err => console.log(err));

function createJson(outputJson) {
    var headers = outputJson[0];
    var params = outputJson.splice(1);

    let arrayAddresses = [];

    function getObjJson(params) {
        return params.reduce((parameter, component, i) => {
            if (i > 0) {
                if (headers[i] === headers[i - 1]) {
                    return setToArrayEqualHeader(headers, parameter, component, i);
                }
            }

            const emailOrPhone = headers[i].split(' ')[0];
            if (emailOrPhone === 'email' || emailOrPhone === 'phone') {
                const addresses = headers[i].split(' ');

                let address = component.replace(':', '').replace('(', '').replace(')', '').replace(' ', '');
                const isEmail = address.split('@').length === 2;
                const isPhoneNumber = !isNaN(address);

                if (emailOrPhone === 'phone') {
                    const phoneNumber = address.split('')
                    const sizePhoneNumber = phoneNumber.length;
                    address = sizePhoneNumber < 10 || sizePhoneNumber > 11 || (sizePhoneNumber === 10 && phoneNumber[2] == 9) ? '' : `55${address}`;
                }

                if ((isEmail && emailOrPhone === 'phone') || (isPhoneNumber && emailOrPhone === 'email')) {
                    address = '';
                }

                if (address == '' || address == ' ') {
                    return parameter;
                }

                if (!isEmail && !isPhoneNumber) {
                    address = address.replace(address, '');
                }

                let arr = address.split('/');

                let oAddress = {
                    type: emailOrPhone,
                    tags: addresses.splice(1).map(address => address = address.split(',').join('')),
                    address,
                }

                if (arr.length > 1) {
                    arr.forEach(a => {
                        oAddress.address = a;
                        arrayAddresses.push(oAddress);
                    });
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

    var out = params.map(getObjJson);

    unifyDataByEid();

    fs.writeFileSync('output.json', JSON.stringify(out, null, 4));

    // --------------------------
    // ---> FUNÇÕES AUXILIARES

    function unifyDataByEid() {
        for (let i = 0; i < out.length; i++) {
            if (i + 1 === out.length) {
                break;
            }

            let j = i + 1;

            if (out[i].eid === out[j].eid) {
                out[i].class.push(...out[j].class);
                out[i].addresses.push(...out[j].addresses);

                if (!out[i].invisible && out[j].invisible) {
                    out[i].invisible = true;
                }

                if (!out[i].see_all && out[j].see_all) {
                    out[i].see_all = true;
                }

                out.splice(j, 1);
            }
        }
    }

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
}









// -------- TRÁS O CSV COMO UM ARRAY DE STRINGS
/* csvToJson({ noheader: true, output: 'csv' })
    .fromFile('src/input.csv')
    .then(input => fs.writeFileSync('arrayCsvFile.json', JSON.stringify(input, null, 4)))
    .catch(err => console.log(err));

const outputJson = JSON.parse(fs.readFileSync('arrayCsvFile.json'));
var headers = outputJson[0];
var params = outputJson.splice(1);

let arrayAddresses = [];

function getObjJson(params) {
    return params.reduce((parameter, component, i) => {
        if (i > 0) {
            if (headers[i] === headers[i - 1]) {
                return setToArrayEqualHeader(headers, parameter, component, i);
            }
        }

        const emailOrPhone = headers[i].split(' ')[0];
        if (emailOrPhone === 'email' || emailOrPhone === 'phone') {
            const addresses = headers[i].split(' ');

            let address = component.replace(':', '').replace('(', '').replace(')', '').replace(' ', '');
            const isEmail = address.split('@').length === 2;
            const isPhoneNumber = !isNaN(address);

            if (emailOrPhone === 'phone') {
                const sizePhoneNumber = address.split('').length;
                address = sizePhoneNumber < 11 || sizePhoneNumber > 11 ? '' : `55${address}`;
            }

            if ((isEmail && emailOrPhone === 'phone') || (isPhoneNumber && emailOrPhone === 'email')) {
                address = '';
            }

            if (address == '' || address == ' ') {
                return parameter;
            }

            if (!isEmail && !isPhoneNumber) {
                address = address.replace(address, '');
            }

            let arr = address.split('/');

            let oAddress = {
                type: emailOrPhone,
                tags: addresses.splice(1).map(address => address = address.split(',').join('')),
                address,
            }

            if (arr.length > 1) {
                arr.forEach(a => {
                    oAddress.address = a;
                    arrayAddresses.push(oAddress);
                });
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

var out = params.map(getObjJson);

unifyDataByEid();

fs.writeFileSync('output.json', JSON.stringify(out, null, 4));

// --------------------------
// ---> FUNÇÕES AUXILIARES

function unifyDataByEid() {
    for (let i = 0; i < out.length; i++) {
        if (i + 1 === out.length) {
            break;
        }

        let j = i + 1;

        if (out[i].eid === out[j].eid) {
            out[i].class.push(...out[j].class);
            out[i].addresses.push(...out[j].addresses);

            if (!out[i].invisible && out[j].invisible) {
                out[i].invisible = true;
            }

            if (!out[i].see_all && out[j].see_all) {
                out[i].see_all = true;
            }

            out.splice(j, 1);
        }
    }
}

function setToArrayEqualHeader(headers, parameter, component, i) {
    if (component !== '') {
        parameter[headers[i]] = `${parameter[headers[i]]}/${component}`;
    }
    parameter[headers[i]] = parameter[headers[i]].replace(', ', '/').replace(' / ', '/').split('/').sort();

    return parameter;
}

function setBooleanValueToHeader(component) {
    return component == 1 || component === 'yes' ? true : false;
} */