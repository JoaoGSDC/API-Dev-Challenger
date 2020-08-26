const fs = require('fs');
const pluralize = require('pluralize')
const csvToJson = require('csvtojson');

csvToJson({ noheader: true, output: 'csv' })
    .fromFile('src/input.csv')
    .then(input => createJson(input))
    .catch(err => console.log(err));

function createJson(outputJson) {
    var headers = outputJson[0];
    var paramsOfJson = outputJson.splice(1);

    function getObjJson(params) {
        return params.reduce((parameter, component, i) => {

            if (headers[i] === headers[i + 1]) {
                headers[i] = pluralize(headers[i]);
                headers[i + 1] = headers[i];
            }

            if (i > 0) {
                if (headers[i] === headers[i - 1]) {
                    return setToArrayEqualHeader(headers, parameter, component, i);
                }
            }

            let componentClean = component.replace(':', '').replace('(', '').replace(')', '').replace('*').replace('+').replace(' ', '');

            const isEmail = checkIsEmailValid(componentClean);
            const isPhoneNumber = checkIsPhoneValid(componentClean);

            let emailOrPhone = '';

            if (headers[i].split(' ').includes('email') || headers[i].split(' ').includes('e-mail') || headers[i].split(' ').includes('mail')) {
                emailOrPhone = 'email';
            }

            if (headers[i].split(' ').includes('phone') || headers[i].split(' ').includes('tel') || headers[i].split(' ').includes('call') || headers[i].split(' ').includes('cell')) {
                emailOrPhone = 'phone';
            }

            if (emailOrPhone === 'email' || emailOrPhone === 'phone') {
                const oHeader = headers[i].split(' ');

                if (emailOrPhone === 'phone') {
                    componentClean = !isPhoneNumber ? '' : `55${componentClean}`;
                }

                if ((isEmail && emailOrPhone === 'phone') || (isPhoneNumber && emailOrPhone === 'email')) {
                    componentClean = '';
                }

                let arr = componentClean.split('/');

                if (!isEmail && !isPhoneNumber) {
                    componentClean = componentClean.replace(componentClean, '');
                }

                if (componentClean == '' || componentClean == ' ') {
                    return parameter;
                }

                const tags = oHeader.splice(1).map(address => address = address.split(',').join(''));

                let oAddress = { type: emailOrPhone, tags, address: componentClean };

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

    var out = paramsOfJson.map(getObjJson);

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

    function checkIsEmailValid(text) {
        const validator = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
        return validator.test(text);
    }

    function checkIsPhoneValid(item) {
        return !isNaN(item) && ((item.split('').length === 10 && item.split('')[2] != 9) || (item.split('').length === 11 && item.split('')[2] == 9));
    }
}