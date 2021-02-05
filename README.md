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

The pages will be generated at the `docs` folder (GitHub pages seems only support deliver root dir or `/docs`!), 
you can serve them locally for debugging with your favorite web server.

As an example, the following instruction shows how to start a simple server with python's `http.server`:

```bash
# This will serve the content at http://localhost:9000
python3 -m http.server --directory docs/ 9000
```

## TODO

- [ ] Pagination.  
- [ ] CLI for adding tags / intro texts.  
- [ ] Archive by month.  
