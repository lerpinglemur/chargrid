import { BLANK_CHAR, CASE_LOWER, CASE_UPPER } from "../consts";

import { longest, isEmpty } from "../util/charutils";
import { rand, randInt } from "../util/util";
import { BuildOpts } from "./buildOpts";
import { Placement } from "../core/placement";

export const NoDiagonals = [

	{dr:1, dc:0},
	{dr:0, dc:1}

];

/**
 * @const {object[]} directions - directions for placing words.
 * Negative directions aren't included since the word can
 * simply be placed in reverse instead.
 */
export const AllDirs = NoDiagonals.concat([

	{dr:1, dc:1},
	{dr:1, dc:-1}

]);

/**
 * @class Builder - build a chargrid.
 */
export class Builder {

	/*get conflicts(){return this._conflicts;}
	set conflicts(v){this._conflicts=v}*/

	/**
	 * @property {CharGrid} grid - grid being built.
	 * Always a cache of puzzle.grid.
	 */
	get grid(){return this._grid;}

	/**
	 * @property {Puzzle} puzzle - puzzle being built.
	 */
	get puzzle(){ return this._puzzle; }
	set puzzle(v){
		this._puzzle=v;
		if ( v ) this._grid = v.grid;
	}

	/**
	 * @property {BuildOpts} opts
	 */
	get opts(){return this._opts;}
	set opts(v){this._opts=v}

	/**
	 * @property {Word[]} unused - input items that could not be added to grid.
	 */
	get unused(){ return this._unused;}
	set unused(v){this._unused=v}

	get rows(){return this._grid.rows;}
	get cols(){return this._grid.cols;}

	/**
	 * @property {boolean} built - true if a puzzle has been built.
	 */
	get built(){return this._built;}
	set built(v){this._built=v}

	constructor( opts=null, puzzle=null ){

		this.opts = opts || new BuildOpts();

		this.unused = null;
		this._built = false;
		this.puzzle = puzzle;

		//if ( this.puzzle && this.puzzle.grid ) {this.built = true;}

	}

	/**
	 * Default does nothing. Override in subclass.
	 */
	build(){

		if ( this.opts ) {
			this.puzzle.title = this.opts.title;
			this.puzzle.difficulty = this.opts.difficulty;
		}

		this._built=true;

	}

	/**
	 * Create grid of appropriate size.
	 */
	createGrid( words ){

		let opts = this.opts;

		let rows = opts.rows;
		let cols = opts.cols;

		let maxWord = longest( words );

		if ( !rows ) {

			if ( opts.minRows && opts.maxRows ) rows = randInt( opts.minRows, opts.maxRows );
			else if ( opts.minRows ) rows = opts.minRows;
			else if ( opts.maxRows ) rows = opts.maxRows;
			else rows = maxWord;

		}
		if ( !cols ) {

			if ( opts.minCols && opts.maxCols ) cols = randInt( opts.minCols, opts.maxCols );
			else if ( opts.minCols ) cols = opts.minCols;
			else if ( opts.maxCols ) cols = opts.maxCols;
			else cols = maxWord;

		}

		this._grid = this.puzzle.initGrid(rows,cols);
		this._grid.opts = this.opts;

		return this._grid;

	}

	/**
	 *
	 * @param {string} word - word being placed.
	 * @param {Direction[]} dirs - valid directions for placement attempts.
	 * @param {number} [quitAt=-1] - quit if the given number of matches is reached.
	 * Defaults to length of word.
	 */
	placeBest( word, dirs, quitAt=-1 ) {

		if ( word.length > this.rows && word.length > this.cols ) return false;

		// best placement found, with cutOff matches set.
		let best = new Placement( quitAt < 0 ? word.length : Math.min(quitAt, word.length ) );

		let dirTries = dirs.length;
		let i = rand( dirTries );

		while ( dirTries-- > 0 ) {

			let { dr, dc } = dirs[i];

			// cutoff reached.
			if ( this.bestDirFit( word, dr, dc, best ) ) {
				break;
			}

			if ( --i < 0 ) i = dirs.length-1;

		}

		if ( best.isValid() ) {
			//console.log('BEST: ' + best.row + ','+ best.col );
			this._grid._setChars( word, best.row,best.col,best.dr,best.dc);
			return best;
		}

		return null;

	}

	/**
	 * Attempt to place word anywhere in the grid with the given direction.
	 * @param {string} word
	 * @param {1|-1|0} dr - row direction.
	 * @param {1|-1|0} dc - column direction.
	 * @param {Placement} best - previous best placement.
	 * @returns {boolean} true if better placement was found
	 * than previous best placement.
	 */
	bestDirFit( word, dr, dc, best ) {

		let minRow = 0, minCol = 0;
		let maxRow = this.rows, maxCol = this.cols;

		if ( dr > 0 ) maxRow = maxRow - word.length + 1;
		else if ( dr < 0 ) minRow += word.length - 1;

		if ( dc > 0 ) maxCol = maxCol - word.length + 1;
		else if ( dc < 0 ) minCol += word.length - 1;

		// random start position.
		let r = randInt( minRow, maxRow ), c = randInt( minCol, maxCol );

		let maxTries = (maxRow-minRow)*(maxCol-minCol );
		/*console.log( word + ' max: ' + maxTries +
			' rows: ' + minRow+'->'+maxRow+'  cols: ' + minCol+'->'+maxCol);*/

		while( maxTries-- > 0 ) {

			let matches = this._grid.countMatches( word, r, c, dr, dc );
			if ( matches > best.matches ) {

				best.setBest(r,c,dr,dc,matches);
				if ( matches >= best.cutOff ) {
					return true;
				}
			}

			// @note advancement of r,c here has nothing to do with direction.
			// It is just attempting to place the word at every grid space.
			if ( --c < minCol ) {
				c = maxCol-1;
				if ( --r < minRow ) r=maxRow-1;
			}

		}

		return false;

	}

	/**
	 * Attempt to place word randomly in the grid.
	 * @param {string} word
	 * @returns {boolean} true on success. false on failure.
	 */
	randPlace( word ) {

		if ( word.length > this.rows && word.length> this.cols ) return false;

		let reverse = !this.opts.noReverse;
		let dirs = this.opts.noDiagonal ? NoDiagonals : AllDirs;

		// randomize placement directions so fallback directions aren't chosen in same order.
		//this.shuffle( directions );

		let dirTries = dirs.length;
		let i = rand( dirTries );

		while ( dirTries-- > 0 ) {

			let { dr, dc } = dirs[i];

			if ( reverse ) {

				if ( Math.random() < this.opts.reverseRate ) {
					dr = -dr;
					dc = -dc;
				}
				if ( this.tryPlaceDir( word, dr, dc, true )) return true;
				if ( this.tryPlaceDir( word, -dr, -dc, true )) return true;

			} else {

				if ( this.tryPlaceDir( word, dr, dc, true )) return true;
			}

			if ( --i < 0 ) i = dirs.length-1;

		}

		return false;

	}

	/**
	 * Attempt to place word anywhere in the grid with the given direction.
	 * @param {string} word
	 * @param {1|-1|0} dr - row direction.
	 * @param {1|-1|0} dc - column direction.
	 * @param {bool} mustMatch
	 */
	tryPlaceDir( word, dr, dc, mustMatch=false ) {

		let rows = this.rows, cols = this.cols;

		// start placing at random position.
		let r = rand( rows ), c = rand( cols );

		let maxTries = rows*cols;
		let lenMinus = word.length-1;

		// todo: row,col checks can be preoptimized.
		while( maxTries-- > 0 ) {

			let oob = false;		// out of bounds.
			if ( dr > 0 ) {
				if ( r + lenMinus >= rows ) oob = true;
			} else if ( dr < 0 ) {
				if ( r-lenMinus < 0 ) oob=true;
			}
			if ( dc > 0 ) {
				if ( c+lenMinus >= cols ) oob = true;
			} else if ( dc < 0 ) {
				if ( c-lenMinus < 0 ) oob = true;
			}

			if ( !oob && this._grid.tryPutWord( word, r,c, dr, dc, mustMatch ) ) return true;
			// @note advancement of r,c here has nothing to do with direction.
			// It is just attempting to place the word at every grid space.
			if ( --c < 0 ) {
				c = cols-1;
				if ( --r < 0 ) r=rows-1;
			}

		}

		return false;

	}

	/**
	 * Fill empty spaces with random characters.
	 */
	fillEmpty( fillChars=BLANK_CHAR ) {

		let chars = this.grid.chars;

		if ( this.opts.forceCase === CASE_LOWER ) fillChars = fillChars.toLocaleLowerCase();
		else if ( this.opts.forceCase === CASE_UPPER ) fillChars = fillChars.toLocaleUpperCase();

		let cols = this.cols;
		let rows = this.rows;

		for( let r = 0; r < rows; r++ ) {

			let a = chars[r];
			for( let c = 0; c < cols; c++ ) {

				if ( !isEmpty(a[c])) continue;
				a[c] = fillChars[ Math.floor( fillChars.length*Math.random() ) ];

			}

		}

	}

	/**
	 * Fill all spaces with same character.
	 * @param {string} [char=BLANK_CHAR]
	 */
	fillAll( char=BLANK_CHAR ) {

		let cols = this.cols;
		let rows = this.rows;

		let chars = this.grid.chars;

		for( let r = 0; r < rows; r++ ) {

			let a = chars[r];
			for( let c = 0; c < cols; c++ ) {

				a[c] = char;

			}

		}

	}

}