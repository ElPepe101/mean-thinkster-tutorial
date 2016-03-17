var express = require('express')
var router = express.Router()

var mongoose = require('mongoose')
var Post = mongoose.model('Post')
var Comment = mongoose.model('Comment')

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

// ···································· Get HOME TEMPLATE
var getHome = function (req, res) {
  res.render('index')
}
router.get('/', getHome)

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
  var postSave = function (err, post) {
    if (err) return next(err)
    res.json(post)
  }
  post.save(postSave)
}
router.post('/posts', postPosts)

// ···································· Put Post Upvote
// curl -X PUT http://localhost:3000/posts/<POST ID>/upvote
var putPostUpvote = function (req, res, next) {
  var reqPostUpvote = function (err, post) {
    if (err) return next(err)
    res.json(post)
  }
  req.post.upvote(reqPostUpvote)
}
router.put('/posts/:post/upvote', putPostUpvote)

// ···································· Post Post Comments
// curl -X PUT http://localhost:3000/posts/<POST ID>/comments
var postPostComments = function (req, res, next) {
  var comment = new Comment(req.body)
  comment.post = req.post

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
router.post('/posts/:post/comments', postPostComments)

// ···································· Put Post Comment Upvote
// curl -X PUT http://localhost:3000/posts/<POST ID>/comments/<COMMENT ID>/upvote
var putPostCommentUpvote = function (req, res, next) {
  var reqPostCommentUpvote = function (err, post) {
    if (err) return next(err)
    res.json(post)
  }
  req.post.upvote(reqPostCommentUpvote)
}
router.put('/posts/:post/comments/:comment/upvote', putPostCommentUpvote)

module.exports = router
