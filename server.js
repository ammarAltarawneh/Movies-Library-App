'use strict';
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const pg = require('pg')

const server = express();
server.use(cors())

const movieData = require('./Movie Data/data.json');
const apiKey = process.env.APIkey;
server.use(express.json())

const PORT = 3000;

const client = new pg.Client(process.env.DATABASE_URL)

server.get('/', homeHandler)
server.get('/favorite', favoritHandler)
server.get('/trending', trending)
server.get('/search', search)
server.get('/top_rated', topRated)
server.get('/similar_movies', SimilarMovies);

server.get('/getMovie', getMovieHandler)
server.post('/addMovie', addMovieHandler)
server.delete('/deleteMovie/:id', deleteMovieHandler)
server.put('/updateMovie/:id', updateMovieHandler)

server.get('/addMovie/:id', getSpecificMovieHandler)

server.get('*', defaultHandler)

///////////// handler functions
function homeHandler(req, res) {
    let movie = new Movie(movieData.title, movieData.poster_path, movieData.overview);
    res.status(200).send(movie);
}

function favoritHandler(req, res) {
    res.status(200).send("Welcome to Favorite Page");
}

function trending(req, res) {
    try {
        let url = `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=en-US`
        axios.get(url)
            .then(result => {
                let mapResult = result.data.results.map(item => {
                    let trendingMovie = new FilmInfo(item.id, item.title, item.release_date, item.poster_path, item.overview)
                    return trendingMovie
                })

                res.send(mapResult)
            })
            .catch((error) => {
                res.status(500).send(error);
            })
    }
    catch (error) {
        errorHandler(error, req, res);
    }
}

function search(req, res) {
    try {
        let url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=The&page=2`;
        axios.get(url)
            .then(result => {

                let searchMovie = result.data.results.map(item => {
                    let movie = new FilmInfo(item.id, item.title, item.release_date, item.poster_path, item.overview)
                    return movie;
                })
                res.send(searchMovie);
            })
            .catch((error) => {
                res.status(500).send(error);
            })
    }
    catch (error) {
        errorHandler(error, req, res);
    }
}

function topRated(req, res) {
    try {
        let url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=en-US&page=1`;
        axios.get(url)
            .then(result => {

                let topRatedMovie = result.data.results.map(item => {
                    let movie = new FilmInfo(item.id, item.title, item.release_date, item.poster_path, item.overview)
                    return movie;
                })
                res.send(topRatedMovie);
            })
            .catch((error) => {
                res.status(500).send(error);
            })
    }
    catch (error) {
        errorHandler(error, req, res);
    }
}

function SimilarMovies(req, res) {
    try {
        let url = `https://api.themoviedb.org/3/movie/10468/similar?api_key=${apiKey}&language=en-US&page=1`;
        axios.get(url)
            .then(result => {

                let similarMovie = result.data.results.map(item => {
                    let movie = new FilmInfo(item.id, item.title, item.release_date, item.poster_path, item.overview)
                    return movie;
                })
                res.send(similarMovie);
            })
            .catch((error) => {
                res.status(500).send(error);
            })
    }
    catch (error) {
        errorHandler(error, req, res);
    }
}

function getMovieHandler(req, res) {
    const sql = `SELECT * FROM seriesrecipe`;
    client.query(sql)
        .then(data => {
            res.send(data.rows);
        })

        .catch((error) => {
            errorHandler(error, req, res)
        })
}

function addMovieHandler(req, res) {
    const recipe = req.body;
    console.log(recipe);
    const sql = `INSERT INTO seriesRecipe (title, releaseYear, overview)
    VALUES ($1, $2, $3);`
    const values = [recipe.title, recipe.releaseYear, recipe.overview];
    client.query(sql, values)
        .then(data => {
            res.send("The data has been added successfully");
        })
        .catch((error) => {
            errorHandler(error, req, res)
        })
}

function deleteMovieHandler(req, res) { // using path params
    const id = req.params.id;

    const sql = `DELETE FROM seriesRecipe WHERE id=${id};`
    client.query(sql)
        .then((data) => {
            res.status(202).send(data)
        })
        .catch((error) => {
            errorHandler(error, req, res)
        })

}

function updateMovieHandler(req, res) {
    // De-structuring 
    const { id } = req.params;

    const sql = `UPDATE seriesRecipe 
    SET title = $1 , releaseYear = $2 , overview = $3 
    WHERE id = ${id};`
    const { title, releaseYear, overview } = req.body;
    const values = [title, releaseYear, overview];
    client.query(sql, values)
        .then((data) => {
            res.send(data)
        })
        .catch((error) => {
            errorHandler(error, req, res)
        })

}

function getSpecificMovieHandler(req, res) {
    const id = req.params.id; // we can use "const id  = req.query.id;" but first change the route for example:/getMovie
                              // then you can type this url: http://localhost:3000/getMovie?id=10

    const sql = `SELECT * FROM seriesrecipe WHERE id = ${id}`;
    client.query(sql)
        .then(data => {
            res.send(data.rows);
        })
        .catch((error) => {
            errorHandler(error, req, res)
        })
}

function defaultHandler(req, res) {
    res.status(404).send('Page not found')
}

server.use(function (err, req, res, next) {
    console.error(err.stack);
    let obj = {
        "status": 500,
        "responseText": "Sorry, something went wrong"
    };
    res.status(500).send(obj);
});

function errorHandler(error, req, res) {
    const err = {
        errNum: 500,
        msg: error
    }
}


////////////////////////



function FilmInfo(id, title, release_date, poster_path, overview) {
    this.id = id;
    this.title = title;
    this.release_date = release_date;
    this.poster_path = poster_path;
    this.overview = overview
}

function Movie(title, poster_path, overview) {
    this.title = title;
    this.poster_path = poster_path;
    this.overview = overview;
}

client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Listening on ${PORT}: I'm ready`)
        })
    })

