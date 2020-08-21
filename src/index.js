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

            if (headers[i] === 'class') {
                headers[i] = 'classes';
            }

            if (i > 0) {
                if (headers[i] === headers[i - 1]) {
                    return setToArrayEqualHeader(headers, parameter, component, i);
                }
            }

            const emailOrPhone = headers[i].split(' ')[0];
            if (emailOrPhone === 'email' || emailOrPhone === 'phone') {
                const addresses = headers[i].split(' ');

                let address = component.replace(':', '').replace('(', '').replace(')', '').replace('*').replace('+').replace(' ', '');
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

                let arr = address.split('/');

                if (!isEmail && !isPhoneNumber) {
                    if (!(address.split('@').length > 1)) {
                        address = address.replace(address, '');
                    }
                }

                if (address == '' || address == ' ') {
                    return parameter;
                }

                const tags = addresses.splice(1).map(address => address = address.split(',').join(''));

                let oAddress = { type: emailOrPhone, tags, address };

                if (arr.length > 1) {
                    arr.forEach(a => {
                        const obj = { type: emailOrPhone, tags, address: a };
                        arrayAddresses.push(obj);
                    });

                    parameter['addresses'] = arrayAddresses;
                    return parameter;
                }

                arrayAddresses.push(oAddress);
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
                out[i].classes.push(...out[j].classes);
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