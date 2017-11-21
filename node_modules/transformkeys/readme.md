# Transform Keys
![travis-cli](https://api.travis-ci.org/Synvox/transformKeys.svg?branch=master)  
Transform keys is a pure function that changes object keys to the case you specify.  

## Installation

```
npm i -s transformkeys
```
## Usage

```javascript
import transformKeys from 'transformkeys'

const obj = transformKeys({
  user_id: 1,
  prop_name: 'hello'
})

obj.userId
// => 1
```

You can specify the case by giving a second parameter:

```javascript
import transformKeys from 'transformkeys'

const obj = transformKeys({
  user_id: 1,
  prop_name: 'hello'
}, 'pascal')

obj.UserId
// => 1
```

For now, these cases are supported:
  1. `camel`
  2. `snake`
  3. `dash`
  4. `constant`
  5. `pascal`

## Contributing
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Make sure tests pass: `npm t`
6. Submit a pull request :D

## License
MIT
