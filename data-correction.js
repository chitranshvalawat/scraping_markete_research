const fs = require('fs');
const path = require('path')
const json2csv = require('json2csv').parse;
const csv = require('csv-parser');
let rows = ['Market', 'Brand', 'Sub Brand', 'Category', 'Sub Category', 'Name', 'IS_Combo', 'If Combo - Size', 'Individual Size (gm)', 'Price (SAR)', 'Link', 'SAR/g'];

async function main() {
    fs.createReadStream('./data/all_data.csv')
        .pipe(csv())
        .on('data', async function (data) {
            let dd = data

            try {
                let name = dd.Name;
                // if(name.includes("7 days")){
                //     name = name.replace("7 days ", "")
                // }
                let weight = name.match(/([\d.]+)(lbs?|oz|g|kg|G)/)
                if (weight) {
                    weight = weight ? weight[0] : dd['Individual Size (gm)'];
                    dd['Individual Size (gm)'] = weight
                }
                else {
                    weight = name.match(/([\d.]+)\s+(lbs?|oz|g|kg|G)/);
                    weight = weight ? weight[0] : dd['Individual Size (gm)'];
                    dd['Individual Size (gm)'] = weight
                }
                // Kelloggs coco pops bars 20 g x 6 pieces
                let combo = name.match(/([\d.]+)\s+(lbs?|oz|g|kg|G|gram)\s+(x|X|×)\s+([\d.])\s+([a-z]|[A-Z]|\+)/)
                if (combo) {
                    console.log(combo);
                    dd.IS_Combo = "yes"
                    let arr = combo[0].split(' ')
                    dd['If Combo - Size'] = arr[arr.length - 2]
                    console.log(arr[arr.length - 2]);
                    // await write('01.csv', rows, row);
                }
                else {
                // Kelloggs coco pops bars 20 g x 6
                    combo = name.match(/([\d.]+)\s+(lbs?|oz|g|kg|G|gram)\s+((x)|(X)|(×))\s+([\d.])/)
                    if (combo) {
                        dd.IS_Combo = "yes"
                        let arr = combo[0].split(' ')
                        dd['If Combo - Size'] = arr[arr.length - 1]
                        // await write('01.csv', rows, row);
                    }
                    else {
                        combo = name.match(/([\d.]+)(lbs?|oz|g|kg|G|gram)\s+(x|X|×)\s+([\d.])/)
                        if (combo) {
                            dd.IS_Combo = "yes"
                            let arr = combo[0].split(' ')
                            dd['If Combo - Size'] = arr[arr.length - 1]
                            // await write('01.csv', rows, row);
                        }
                        else {
                            combo = name.match(/([\d.]+)\s+(lbs?|oz|g|kg|G|gram)\s+(x|X|×)([\d.])\s/)
                            if (combo) {
                                dd.IS_Combo = "yes"
                                let arr = combo[0].split(' ')
                                dd['If Combo - Size'] = arr[arr.length - 1]
                                // await write('01.csv', rows, row);
                            }
                            else {
                                combo = name.match(/([\d.]+)(lbs?|oz|g|kg|G|gram)(x|X|×)\s+([\d.])\s/)
                                if (combo) {
                                    dd.IS_Combo = "yes"
                                    let arr = combo[0].split(' ')
                                    dd['If Combo - Size'] = arr[arr.length - 1]
                                    // await write('01.csv', rows, row);
                                }
                                else {
                                    combo = name.match(/([\d.]+)(lbs?|oz|g|kg|G|gram)(x|X|×)([\d.])\s/)
                                    if (combo) {
                                        dd.IS_Combo = "yes"
                                        let arr = combo[0].split(' ')
                                        dd['If Combo - Size'] = arr[arr.length - 1]
                                        // await write('01.csv', rows, row);
                                    }
                                }
                            }
                        }
                    }
                }
                weight = dd['Individual Size (gm)'].replace("g", "");
                let price = dd['Price (SAR)'].replace("SAR", "")
                dd['SAR/g'] = parseFloat(price) / parseFloat(weight)
                if (dd.IS_Combo == "yes") {
                    dd['SAR/g'] = dd['SAR/g'] / dd['If Combo - Size']
                }
                if (dd['Individual Size (gm)'] == "1 pieces/kg") {
                    dd['SAR/g'] = "NA"
                }
                console.log(dd);
                await write('updated_final.csv', rows, [dd]);

            }
            catch (err) {
                console.log(err);
            }
        })
        .on('end', function () {

        });
}
main();

const write = async (fileName, fields, data) => {
    // output file in the same folder
    const filename = path.join(__dirname, `${fileName}`);
    let rows;
    // If file doesn't exist, we will create new file and add rows with headers.    
    if (!fs.existsSync(filename)) {
        rows = json2csv(data, { header: true });
    } else {
        // Rows without headers.
        rows = json2csv(data, { header: false });
    }

    // Append file function can create new file too.
    fs.appendFileSync(filename, rows);
    // Always add new line if file already exists.
    fs.appendFileSync(filename, "\r\n");
}