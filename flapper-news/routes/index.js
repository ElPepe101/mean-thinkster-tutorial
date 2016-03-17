var express = require('express')
var router = express.Router()
var passport = require('passport')
var jwt = require('express-jwt')
var auth = jwt({secret: process.env.SECRET, userProperty: 'payload'})

var mongoose = require('mongoose')
var Post = mongoose.model('Post')
var Comment = mongoose.model('Comment')
var User = mongoose.model('User')

// ···································· Post Register
var register = function (req, res, next) {
  if (!req.body.username || !req.body.password) return res.status(400).json({message: 'Please fill out all fields.'})

  var user = new User()
  user.username = req.body.username
  user.setPassword(req.body.password)

  var save = function (err) {
    if (err) return next(err)

    return res.json({token: user.generateJWT})
  }
  user.save(save)
}
router.post('/register', register)

// ···································· Post Login
var login = function (req, res, next) {
  if (!req.body.username || !req.body.password) return res.status(400).json({message: 'Please fill out all fields.'})

  var authenticate = function (err, user, info) {
    if (err) return next(err)
    if (user) return res.json({token: user.generateJWT})
    else return res.status(401).json(info)
  }
  passport.authenticate('local', authenticate)(req, res, next)
}
router.post('/login', login)

// ···································· Get HOME TEMPLATE
var getHome = function (req, res) {
  res.render('index')
}
router.get('/', getHome)

var paramPost = function (req, res, next, id) {
  var query = Post.findById(id)
  var queryExec = function (err, post) {
    if (err) return next(err)
    if (!post) return next(new Error('can\'t find post'))

    req.post = post

    return next()
  }
  query.exec(queryExec)
}
router.param('post', paramPost)

var paramComment = function (req, res, next, id) {
  var query = Comment.findById(id)
  var queryExec = function (err, comment) {
    if (err) return next(err)
    if (!comment) return next(new Error('can\'t find comment'))

    req.comment = comment

    return next()
  }
  query.exec(queryExec)
}
router.param('comment', paramComment)

// ···································· Get Posts
// curl http://localhost:3000/posts
var getPosts = function (req, res, next) {
  Post.find(function (err, posts) {
    if (err) return next(err)

    res.json(posts)
  })
}
router.get('/posts', getPosts)

// ···································· Get Post
// curl http://localhost:3000/posts/<POST ID>
var getPost = function (req, res, next) {
  var reqPost = function (err, post) {
    if (err) return next(err)

    res.json(post)
  }
  req.post.populate('comments', reqPost)
}
router.get('/posts/:post', getPost)

// ···································· Post Posts
// curl --data 'title=test&link=http://test.com' http://localhost:3000/posts
var postPosts = function (req, res, next) {
  var post = new Post(req.body)
  post.author = req.payload.username

  var postSave = function (err, post) {
    if (err) return next(err)

    res.json(post)
  }
  post.save(postSave)
}
router.post('/posts', auth, postPosts)

// ···································· Put Post Upvote
// curl -X PUT http://localhost:3000/posts/<POST ID>/upvote
var putPostUpvote = function (req, res, next) {
  var reqPostUpvote = function (err, post) {
    if (err) return next(err)

    res.json(post)
  }
  req.post.upvote(reqPostUpvote)
}
router.put('/posts/:post/upvote', auth, putPostUpvote)

// ···································· Post Post Comments
// curl -X PUT http://localhost:3000/posts/<POST ID>/comments
var postPostComments = function (req, res, next) {
  var comment = new Comment(req.body)
  comment.post = req.post
  comment.author = req.payload.username

  var CommentSave = function (err, comment) {
    if (err) return next(err)

    req.post.comments.push(comment)
    var reqPostSave = function (err, post) {
      if (err) return next(err)

      res.json(comment)
    }
    req.post.save(reqPostSave)
  }
  comment.save(CommentSave)
}
router.post('/posts/:post/comments', auth, postPostComments)

// ···································· Put Post Comment Upvote
// curl -X PUT http://localhost:3000/posts/<POST ID>/comments/<COMMENT ID>/upvote
var putPostCommentUpvote = function (req, res, next) {
  var reqPostCommentUpvote = function (err, post) {
    if (err) return next(err)

    res.json(post)
  }
  req.post.upvote(reqPostCommentUpvote)
}
router.put('/posts/:post/comments/:comment/upvote', auth, putPostCommentUpvote)

module.exports = router
