var passport = require('passport')
var mongoose = require('mongoose')
var User = mongoose.model('User')
var LocalStrategy = require('passport-local').Strategy

var strategy = function (username, password, done) {
  var findUser = function (err, user) {
    if (err) return done(err)
    if (!user) return done(null, false, {message: 'Incorrect username.'})
    if (!user.validPassword(password)) return done(null, false, {message: 'Incorrect password.'})

    return done(null, user)
  }
  User.findOne({username: username}, findUser)
}

passport.use(new LocalStrategy(strategy))
