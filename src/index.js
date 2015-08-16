'use strict';

import Promise from 'promise';
import isPromise from 'is-promise';

function noop() {}
export default function reduxWait(...middlewares) {
  return function (next) {
    return function (reducer, initialState) {
      var store = next(reducer, initialState);
      var dispatch = store.dispatch;
      var chain = [];

      var pending = 0, onSuccess, onFailure;
      function handleWatingOnMiddleware(middleware) {
        return action => {
          let result = middleware(action);
          if (isPromise(result)) {
            pending++;
            Promise.resolve(result).done(function () {
              pending--;
              if (pending === 0 && onSuccess) onSuccess();
            }, function (err) {
              if (onError) onError(err);
              else throw err;
            });
          }
          return result;
        }
      }
      var middlewareAPI = {
        getState: store.getState,
        dispatch: (action) => dispatch(action)
      };
      chain = middlewares.map(
        middleware => middleware(middlewareAPI)
      ).map(
        middleware => next => handleWatingOnMiddleware(middleware(next))
      );
      dispatch = compose(...chain, store.dispatch);

      function renderToString(React, element) {
        return new Promise(function (resolve, reject) {
          let html = '', resolved = false;
          let dirty = false, inProgress = false;
          onFailure = (err) => {
            resolved = true;
            reject(err);
          };
          onSuccess = () => {
            resolved = true;
            resolve(html)
          };
          function render() {
            if (resolved) return;
            dirty = true;
            if (inProgress) return;
            inProgress = true;
            while (dirty && !resolved) {
              dirty = false;
              html = React.renderToString(element);
            }
            inProgress = false;
          }
          store.subscribe(render);
          render();
          if (pending === 0) onSuccess();
        });
      }
      return {
        ...store,
        dispatch,
        renderToString
      };
    };
  };
}

function compose(...funcs) {
  return funcs.reduceRight((composed, f) => f(composed));
}
