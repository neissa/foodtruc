// localStorage persistence
var STORAGE_KEY = "articles-vuejs-2.0";
var articleStorage = {
    fetch: function() {
        var articles = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        articles.forEach(function(article, index) {
            article.id = index;
        });
        articleStorage.uid = articles.length;
        return articles;
    },
    count: function() {
        var articles = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return articles.length;
    },
    save: function(articles) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    }
};

// visibility filters
var filters = {
    all: function(articles) {
        return articles;
    },
    active: function(articles) {
        return articles.filter(function(article) {
            return !article.completed;
        });
    },
    en_stock: function(articles) {
        return articles.filter(function(article) {
            return article.stock != null && article.stock > article.number;
        });
    },
    completed: function(articles) {
        return articles.filter(function(article) {
            return article.completed;
        });
    }
};

// app Vue instance
var app = new Vue({
    // app initial state
    data: {
        articles: articleStorage.fetch(),
        newarticle: "",
        editedarticle: null,
        visibility: "all",
        isShowing:articleStorage.count()===0,
    },

    // watch articles change for localStorage persistence
    watch: {
        articles: {
            handler: function(articles) {
                articleStorage.save(articles);
            },
            deep: true
        }
    },

    // computed properties
    // http://vuejs.org/guide/computed.html
    computed: {
        filteredarticles: function() {
            return filters[this.visibility](this.articles);
        },
        remaining: function() {
            return filters.active(this.articles).length;
        },
        allDone: {
            get: function() {
                return this.remaining === 0;
            },
            set: function(value) {
                this.articles.forEach(function(article) {
                    article.completed = value;
                });
            }
        }
    },

    filters: {
        pluralize: function(n) {
            return n === 1 ? "article" : "articles";
        }
    },

    // methods that implement data logic.
    // note there's no DOM manipulation here at all.
    methods: {
        addarticle: function() {
            var value = this.newarticle && this.newarticle.trim();
            if (!value) {
                return;
            }
            this.articles.push({
                id: articleStorage.uid++,
                title: value,
                completed: false,
                number:0,
                stock:null
            });
            this.newarticle = "";
        },

        removearticle: function(article) {
            if( confirm("Sûre ?") )
                this.articles.splice(this.articles.indexOf(article), 1);
        },

        editarticle: function(article) {
            this.beforeEditCache = article.title;
            this.editedarticle = article;
        },
        addonearticle: function(article) {
            article.number++;
            play(article.title);

        },
        removeonearticle: function(article) {
            if( article.number>0)
                article.number--;
        },
        doneEdit: function(article) {
            if (!this.editedarticle) {
                return;
            }
            this.editedarticle = null;
            article.title = article.title.trim();
            if (!article.title) {
                this.removearticle(article);
            }
        },

        cancelEdit: function(article) {
            this.editedarticle = null;
            article.title = this.beforeEditCache;
        },

        removeCompleted: function() {
            if( confirm("Sûre ?") )
                this.articles = filters.active(this.articles);
        },
        cleanCompleted: function() {
            if( confirm("Sûre ?") )
                this.articles.forEach(function(article) {
                    article.stock = ( article.stock - article.number > 0?  article.stock - article.number : 0);
                    article.number = 0;
                });
        }
    },

    // a custom directive to wait for the DOM to be updated
    // before focusing on the input field.
    // http://vuejs.org/guide/custom-directive.html
    directives: {
        "article-focus": function(el, binding) {
            if (binding.value) {
                el.focus();
            }
        }
    }
});

// handle routing
function onHashChange() {
    var visibility = window.location.hash.replace(/#\/?/, "");
    if (filters[visibility]) {
        app.visibility = visibility;
    } else {
        window.location.hash = "";
        app.visibility = "all";
    }
}

window.addEventListener("hashchange", onHashChange);
onHashChange();

function play(text) {
    var http = new XMLHttpRequest();

    http.open('HEAD', "/sons/"+text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f ]/g, "")+".m4a", false);
    http.send();

    if(http.status !== 404)
    {
        var myAudio = document.createElement('audio');
        myAudio.setAttribute('src', "/sons/"+text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f ]/g, "")+".m4a");
        myAudio.play();
    }
    else {
        var msg = new SpeechSynthesisUtterance(text);
        msg.pitch = 0.7;
        msg.rate = 2.5;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
    }

}

// mount
app.$mount(".articleapp");