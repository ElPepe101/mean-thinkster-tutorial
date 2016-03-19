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
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      controllerAs: 'auth',
      onEnter: [
        '$state',
        'auth',
        function ($state, auth) {
          if (auth.isLoggedIn()) {
            $state.go('home')
          }
        }
      ]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      controllerAs: 'auth',
      onEnter: [
        '$state',
        'auth',
        function ($state, auth) {
          if (auth.isLoggedIn()) {
            $state.go('home')
          }
        }
      ]
    })

  $urlRouterProvider.otherwise('home')
}
app.config(['$stateProvider', '$urlRouterProvider', config])

// ······································
// ··········· POST SERVICE ·············
var posts = function ($http, auth) {
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

    return $http.post('/posts', post, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(success)
  }

  posts.upvote = function (post) {
    var success = function (data) {
      post.upvotes += 1
    }

    return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(success)
  }

  posts.getPost = function (id) {
    var getPost = function (res) {
      return res.data
    }

    return $http.get('/posts/' + id).then(getPost)
  }

  posts.addPostComment = function (id, comment) {
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    })
  }

  posts.upvoteComment = function (post, comment) {
    var success = function (data) {
      comment.upvotes += 1
    }
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(success)
  }

  return posts
}
app.factory('posts', ['$http', 'auth', posts])

// ······································
// ··········· AUTH SERVICE ·············
var auth = function ($http, $window) {
  var auth = {}

  auth.saveToken = function (token) {
    $window.localStorage['flapper-news-token'] = token
  }

  auth.getToken = function () {
    return $window.localStorage['flapper-news-token']
  }

  auth.isLoggedIn = function () {
    var token = auth.getToken()
    // If a token exists, we'll need to check the payload to see if the token has expired,
    // otherwise we can assume the user is logged out.
    if (!!!token) {
      // The payload is the middle part of the token between the two '.'s.
      // It's a JSON object that has been base64'd.
      var payload = JSON.parse($window.atob(token.split('.')[1]))

      return payload.exp > Date.now() / 1000
    } else {
      return false
    }
  }

  auth.currentUser = function () {
    if (auth.isLoggedIn()) {
      var token = auth.getToken()
      var payload = JSON.parse($window.atob(token.splt('.')[1]))

      return payload.username
    }
  }

  auth.register = function (user) {
    var success = function (data) {
      auth.saveToken(data.token)
    }

    return $http.post('/register', user).success(success)
  }

  auth.logIn = function (user) {
    var success = function (data) {
      auth.saveToken(data.token)
    }

    return $http.post('/login', user).success(success)
  }

  auth.logOut = function () {
    $window.localStorage.removeItem('flapper-news-token')
  }

  return auth
}
// We'll need to inject $http for interfacing with our server,
// and $window for interfacing with localStorage.
app.factory('auth', ['$http', '$window', auth])

// ·············································
// ············ HOME CONTROLLER ················
var HomeCtrl = function (posts, auth) {
  var self = this
  self.posts = posts.posts
  self.show = auth.isLoggedIn()

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
app.controller('HomeCtrl', ['posts', 'auth', HomeCtrl])

// ··············································
// ············ POSTS CONTROLLER ················
var PostsCtrl = function (posts, post, auth) {
  var self = this
  self.post = post
  self.show = auth.isLoggedIn()

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
app.controller('PostsCtrl', ['posts', 'post', 'auth', PostsCtrl])

// ··············································
// ············· AUTH CONTROLLER ················
var AuthCtrl = function ($state, auth) {
  var self = this

  self.register = function () {
    var error = function (error) {
      self.error = error
    }

    var then = function () {
      $state.go('home')
    }

    auth.register(self.user).error(error).then(then)
  }

  self.logIn = function () {
    var error = function (error) {
      self.error = error
    }

    var then = function () {
      $state.go('home')
    }

    auth.logIn(self.user).error(error).then(then)
  }
}
app.controller('AuthCtrl', ['$state', 'auth', AuthCtrl])

// ··············································
// ·············· NAV CONTROLLER ················
var NavCtrl = function (auth) {
  var self = this
  self.isLoggedIn = auth.isLoggedIn()
  self.currenUser = auth.currentUser()
  self.links = [
    {
      show: self.isLoggedIn,
      text: self.currentUser,
      href: '',
      click: null
    },
    {
      show: self.isLoggedIn,
      text: 'Log Out',
      href: '',
      click: auth.logOut
    },
    {
      show: !self.isLoggedIn,
      text: 'Log In',
      href: '/#/login',
      click: null
    },
    {
      show: !self.isLoggedIn,
      text: 'Register',
      href: '/#/register',
      click: null
    }
  ]
}
app.controller('NavCtrl', ['auth', NavCtrl])
