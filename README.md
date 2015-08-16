# redux-wait

A helper to let you wait for redux actions to be processed in a universal app.

[![Build Status](https://img.shields.io/travis/ForbesLindesay/redux-wait/master.svg)](https://travis-ci.org/ForbesLindesay/redux-wait)
[![Dependency Status](https://img.shields.io/gemnasium/ForbesLindesay/redux-wait.svg)](https://gemnasium.com/ForbesLindesay/redux-wait)
[![NPM version](https://img.shields.io/npm/v/redux-wait.svg)](https://www.npmjs.org/package/redux-wait)

## Installation

    npm install redux-wait


## Usage

### 1. Replace `applyMiddleware` with `redux-await`


```diff
- var applyMiddleware = require('redux').applyMiddleware;
+ var applyMiddleware = require('redux-wait');
```

This will add an extra method to your store called `store.renderToString`.

### 2. Ensure all middleware returns a promise (or runs synchronously)

If you're not using any custom middleware and you're not using redux-thunk, you can skip this step.

If you are writing asynchronous middleware, you need to make sure your middleware returns a promise
that is only resolved once it has finished processing the action.  [redux-promise](https://github.com/acdlite/redux-promise) is a perfect example of how to do this.

If you are using redux-thunk, you can only use it synchronously, or it will break server rendering.

Good:

```js
// action creator
function loadUser(login) {
  return (dispatch, getState) => {
    const user = getState().entities.users[login];
    if (user) {
      return null;
    }

    return dispatch(fetchUser(login));
  };
}
```

Bad:

```js
// action creator
function loadUser(login) {
  return (dispatch, getState) => {
    const user = getState().entities.users[login];
    if (user) {
      return null;
    }

    $.getJson('/user/' + login, function (data) {
      // The server won't wait for this action :(
      dispatch({type: 'LOADED_USER', user: data});
    });
  };
}
```

### 3. Ensure that actions to load data are not fired if the data is alreay loading

Good:

```js
componentWillMount() {
  if (!this.props.isLoading && !this.props.user) {
    this.props.dispatch(loadUser());
  }
}
```

Bad:

```js
componentWillMount() {
  if (!this.props.user) {
    this.props.dispatch(loadUser());
  }
}
```

### 4. Render the page in your server

```js
// N.B. `createStore` is the result of using redux-wait instead of Redux.applyMiddleware
let store = createStore();
let element = <Root history={new MemoryHistory([req.url])} store={store} />;
store.renderToString(React, element).done(function (html) {
  res.send(
    indexHtml.replace(
      '{{content}}',
      html
    ).replace(
      '{{state}}',
      stringify(store.getState())
    )
  );
}, next);
```

## License

  MIT
