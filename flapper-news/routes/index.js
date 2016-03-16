var express = require('express')
var router = express.Router()

var mongoose = require('mongoose')
var Post = mongoose.model('Post')
var Comment = mongoose.model('Comment')

var paramPost = function (req, res, next, id) {
  var query = Post.findById(id)
  query.exec(function (err, post) {
    if (err) return next(err)
    if (!post) return next(new Error('can\'t find post'))
    req.post = post
    return next()
  })
}
router.param('post', paramPost)

// curl http://localhost:3000/posts
var getPosts = function (req, res, next) {
  Post.find(function (err, posts) {
    if (err) return next(err)
    res.json(posts)
  })
}
router.get('/posts', getPosts)

// curl http://localhost:3000/posts/<POST ID>
var getPostsPost = function (req, res) {
  res.json(req.post)
}
router.get('/posts/:post', getPostsPost)

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

// curl -X PUT http://localhost:3000/posts/<POST ID>/upvote
var putPostsPostUpvote = function (req, res, next) {
  var reqPostUpvote = function (err, post) {
    if (err) return next(err)
    res.json(post)
  }
  req.post.upvote(reqPostUpvote)
}
router.put('/posts/:post/upvote', putPostsPostUpvote)

module.exports = router
