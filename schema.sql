DROP TABLE IF EXISTS seriesRecipe;


CREATE TABLE IF NOT EXISTS seriesRecipe (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    releaseYear VARCHAR(255),
    overview VARCHAR(255)
);