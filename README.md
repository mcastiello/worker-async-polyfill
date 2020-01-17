# Worker Polyfill
The purpose of this library is to add a simple polyfill to be used where the browser doesn't provide the Worker class. 

**BE AWARE**: While the code will work asynchronously, it won't run in a separate thread.

Let's say that if you want to use worker without caring about browser compatibility or test libraries that use workers, this one may be for you.

### Usage
It should (more or less) implement a similar interface of the [original Worker class](https://developer.mozilla.org/en-US/docs/Web/API/Worker).
```javascript
// worker.js
onmessage = evt => {
  console.log("Message received", evt.data);
}

postMessage("Hello world!");
```
```javascript
// index.js
const worker = new Worker("./worker.js");

worker.addEventListener("message", evt => {
  console.log("Hello Worker!", evt.data);
  worker.postMessage({
    "id": 1,
    "list": ["item1","item2","item3"]
  });
});
```
It may miss some of the functionalities, but for example it mimic the support of the **Transferable** objects (Usually the message content is cloned, except for those supported classes that can be transfered by reference).
