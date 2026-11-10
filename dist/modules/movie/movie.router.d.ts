import { Router } from 'express';
import { MovieRepository } from '../../db/repositories/movie.repository.js';
export declare function createMovieRouter(repo: MovieRepository): Router;
