'use strict'
var angular = angular ? angular : null

// ······································
// ·············· MODULE ················
var app = angular.module('flapperNews', ['ui.router'])
var config = function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'HomeCtrl',
      controllerAs: 'home',
      resolve: {
        postPromise: [
          'posts',
          function (posts) {
            return posts.getAll()
          }
        ]
      }
    })
    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      controllerAs: 'posts',
      resolve: {
        post: [
          '$stateParams',
          'posts',
          function ($stateParams, posts) {
            return posts.getPost($stateParams.id)
          }
        ]
      }
    })

  $urlRouterProvider.otherwise('home')
}
app.config(['$stateProvider', '$urlRouterProvider', config])

// ······································
// ··········· POST SERVICE ·············
var posts = function ($http) {
  var posts = {
    posts: []
  }

  posts.getAll = function () {
    var success = function (data) {
      angular.copy(data, posts.posts)
    }

    return $http.get('/posts').success(success)
  }

  posts.create = function (post) {
    var success = function (data) {
      posts.posts.push(data)
    }

    return $http.post('/posts', post).success(success)
  }

  posts.upvote = function (post) {
    var success = function (data) {
      post.upvotes += 1
    }

    return $http.put('/posts/' + post._id + '/upvote').success(success)
  }

  posts.getPost = function (id) {
    var getPost = function (res) {
      return res.data
    }

    return $http.get('/posts/' + id).then(getPost)
  }

  posts.addPostComment = function (id, comment) {
    return $http.post('/posts/' + id + '/comments', comment)
  }

  posts.upvoteComment = function (post, comment) {
    var success = function (data) {
      comment.upvotes += 1
    }
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(success)
  }

  return posts
}
app.factory('posts', ['$http', posts])

// ······································
// ··········· AUTH SERVICE ·············
var auth = function ($http, $window) {
  var auth = {}

  auth.saveToken = function (token) {
    $window.localStorage['flapper-news-token'] = token
  }

  auth.getToken = function () {
    return $window.localStorage['flapper-new-token']
  }

  auth.isLoggedIn = function () {
    var token = auth.getToken()
    // If a token exists, we'll need to check the payload to see if the token has expired,
    // otherwise we can assume the user is logged out.
    if (token) {
      // The payload is the middle part of the token between the two '.'s.
      // It's a JSON object that has been base64'd.
      var payload = JSON.parse($window.atob(token.split('.')[1]))

      return payload.exp > Date.now() / 1000
    } else {
      return false
    }
  }

  auth.register = function (user) {
    var success = function (data) {
      auth.saveToken(data.token)
    }

    return $http.post('/register', user).success(success)
  }

  auth.login = function (user) {
    var success = function (data) {
      auth.saveToken(data.token)
    }

    return $http.post('/login', user).success(success)
  }

  return auth
}
// We'll need to inject $http for interfacing with our server,
// and $window for interfacing with localStorage.
app.factory('auth', ['$http', '$window', auth])

// ·············································
// ············ HOME CONTROLLER ················
var HomeCtrl = function (posts) {
  var self = this

  self.posts = posts.posts

  self.addPost = function () {
    if (!self.title || self.title === '') return

    posts.create(
      {
        title: self.title,
        link: self.link
      }
    )
    self.title = ''
    self.link = ''
  }

  self.incrementUpvotes = function (post) {
    posts.upvote(post)
  }
}
app.controller('HomeCtrl', ['posts', HomeCtrl])

// ··············································
// ············ POSTS CONTROLLER ················
var PostsCtrl = function (posts, post) {
  var self = this
  console.log(post)
  self.post = post

  self.addComment = function () {
    if (self.body === '') return
    var success = function (comment) {
      self.post.comments.push(comment)
    }

    posts.addPostComment(post._id,
      {
        body: self.body,
        author: 'user'
      }
    ).success(success)
    self.body = ''
  }

  self.incrementUpvotes = function (comment) {
    posts.upvoteComment(post, comment)
  }
}
app.controller('PostsCtrl', ['posts', 'post', PostsCtrl])
