const puppeteer = require('puppeteer');
var fs = require('fs');
const json2csv = require('json2csv').parse;
const path = require('path')

main = async () => {
    const browser = await puppeteer.launch({
        // executablePath: "/bin/brave-browser",
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.setDefaultTimeout(0)
    await page.setDefaultNavigationTimeout(0)

    await page.goto("https://www.carrefourksa.com/");  
    await page.$eval('a[data-testid="change_language"]', el  => el.click());
    await page.goto("https://www.carrefouruae.com/mafuae/en/v4/search?keyword=bread%20chips");  

    let scrollHeight = await page.evaluate(() => document.body.scrollHeight)
    await page.evaluate(`window.scrollTo(0, ${scrollHeight - 1200})`);
    await page.waitForTimeout(4000)
    let el = await page.$('.css-qo9h12 .css-1hbp62g .css-663krk')
    do {
        el ? await el.click() : null;
        await page.waitForTimeout(4000)
        scrollHeight = await page.evaluate(() => document.body.scrollHeight)
        await page.evaluate(`window.scrollTo(0, ${scrollHeight - 1200})`);
        el = await page.$('.css-qo9h12 .css-1hbp62g .css-663krk')
    }while(el)
    // await page.evaluate(`let el = document.querySelector('.css-qo9h12 .css-1hbp62g .css-663krk')                        
    //                         while (el != null) {
    //                         el.click();
    //                         window.scrollTo(0, document.body.scrollHeight-200)
    //                         el = document.querySelector('.css-qo9h12 .css-1hbp62g .css-663krk')
    //                     }`);

    let urls = []
    let els = await page.$$("div.css-1nhiovu a")
    let scroll = 200;
    await page.waitForTimeout(2000)
    scrollHeight = await page.evaluate(() => document.body.scrollHeight)
    console.log(scrollHeight);
    do {
        await page.waitForTimeout(200);
        els = await page.$$eval("div.css-1nhiovu a", elements => {
            return elements.map(el => "https://www.carrefourksa.com" + el.getAttribute('href'))
        })
        for (let i = 0; i < els.length; i++) {
            const el = els[i];
            if (urls.includes(el) == false) {
                urls.push(el)
            }
        }
        await page.waitForTimeout(200);
        await page.evaluate(`window.scrollTo(0, ${scroll})`);
        scroll = scroll + 200;
    } while (scroll <= scrollHeight);

    await page.waitForTimeout(5000)
    // console.log(urls.length);
    let rows = ['Market', 'Brand', 'Sub Brand', 'Category', 'Sub Category', 'Name', 'IS_Combo', 'If Combo - Size', 'Individual Size (gm)', 'Price (SAR)', 'Link', 'SAR/g'];
    console.log(urls.length + " urls found");
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(i);
        console.log(url);
        await page.goto(url);
        await page.waitForTimeout(2000);
        let market = "Carrefour";
        let brand = await page.$(".css-1nnke3o") ? await page.$eval('.css-1nnke3o', el => el.innerText) : "NA"
        let sub_brand = brand;
        let category = await page.$$eval('.css-vs30iz', el => el[el.length - 2].innerText);
        let sub_category = await page.$$eval('.css-vs30iz', el => el[el.length - 1].innerText);
        let name = await page.$eval('h1.css-106scfp', el => el.innerText);
        let nameArr = name.split(' ')
        let is_combo = nameArr[nameArr.length - 2] == 'x' ? "Yes" : "No"
        let combo_size = nameArr[nameArr.length - 2] == 'x' ? nameArr[nameArr.length - 1] : "NA"
        let individual_size = await page.$('.css-rfypxx') ? await page.$eval('.css-rfypxx', el => el.innerText.split(": ")[1]) : 'NA'
        individual_size = individual_size.split(" ")[1] == 'pieces/kg' ? individual_size.split(" ")[1] == 'g' || individual_size.split(" ")[1] == 'ml' ? individual_size.split(" ")[0] : individual_size.split(" ")[0] * 1000 : "1 pieces/kg"
        let pp = await page.$('.css-17ctnp')
        let price = pp ? await page.$eval('h2.css-17ctnp', el => el.innerText.split(" ")[1].split("(")[0].split("\n")[0]) : await page.$eval('.css-1i90gmp', el => el.innerText.split(" ")[1].split("(")[0].split("\n")[0]);
        let link = url;
        let SAR_per_gm = individual_size.split(" ")[1] == 'pieces/kg' ? individual_size == 'NA' ? 'NA' : parseFloat(price) / parseFloat(individual_size) : "NA"

        let row = [{
            'Market': market,
            'Brand': brand,
            'Sub Brand': sub_brand,
            'Category': category,
            'Sub Category': sub_category,
            'Name': name,
            'IS_Combo': is_combo,
            'If Combo - Size': combo_size,
            'Individual Size (gm)': individual_size,
            'Price (SAR)': price,
            'Link': link,
            'SAR/g': SAR_per_gm
        }]

        await write('01.csv', rows, row);
    }

    // writeNameToCSVFile(rows)

    browser.close();
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
