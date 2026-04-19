## Guide for how to customise the XSLT for the invoice PDF generation
So there are three parts here. The actual backend uses the `.sef.json` file which is generated from the `.xslt` file.

- The HTML file used for visually changing the finalised PDF is this one: `/ubl2.4/xslt/html/test.html`
- Once you've made changes to it, and like how it looks, make the same changes to the .xslt file (this is currently `s4.xslt`).
- Once you have done this, run the `gen-xslt-json.sh` script like this `./gen-xslt-json.sh s4.xslt s4.sef.json`.

This will then re-create the `.sef.json` file which the backend then uses for rendering the HTML/PDF via puppeteer.