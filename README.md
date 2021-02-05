# My Blog in GitHub pages.

Currently WIP.

## requirements

We need `Node.js` to run the scripts generating static sites.

## instructions

Firstly, install requirements.

```bash
npm i
```

Then, put your articles into the `articles` folder, then generate the static sites:

```bash
# at project root directory.
node scripts/gen_static_pages.js
```

## TODO
    [] Pagination.
    [] CLI for adding tags / intro texts.
    [] Archive by month.