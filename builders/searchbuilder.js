import { Builder, NoDiagonals, AllDirs } from "./builder";
import { WordSearch } from "../wordsearch/wordsearch";
import { SearchOpts } from "../wordsearch/searchopts";
import {  isEmpty, NonWord } from "../util/charutils";
import { CASE_LOWER, CASE_UPPER, LowerChars } from "../consts";

export class SearchBuilder extends Builder {

	constructor( opts=null, puzzle=null ){

		super( opts || new SearchOpts(), puzzle || new WordSearch() );

	}

	/**
	 * Attempt to place all listed words in the grid.
	 * @param {string[]} words
	 * @returns {string[]} list of words that couldn't be placed.
	 */
	build( words ) {

		if ( !Array.isArray(words) ) throw new Error('Words must be array.');

		// fit large words first.
		words = words.concat().sort((a,b)=>a.length-b.length);

		this.puzzle.clearPlaced();
		this.prepareWords( words, this.opts );

		this.createGrid( words );

		this._placeWords( words, this.grid );

		this.fillEmpty( this.opts.filler || LowerChars );

		super.build();

		return this.puzzle;

	}

	/**
	 * Prepare words before being added.
	 * @param {string[]} words
	 */
	prepareWords( words, opts ) {

		for( let i = words.length-1; i>= 0; i--) {

			let w = words[i];
			if (!opts.noTrim) w = w.trim();
			if ( opts.forceCase === CASE_LOWER ) {
				w = w.toLocaleLowerCase();
			} else if ( opts.forceCase === CASE_UPPER ) {
				w = w.toLocaleUpperCase();
			}
			if ( !opts.allowNonword ) {
				w = w.replace( NonWord, '' );
			}

			words[i] = w;

		}

		return words;

	}

	_placeWords( words ){

		let unused = [];
		let used = this._puzzle.words = [];

		let dirs = this.opts.noDiagonal ? NoDiagonals : AllDirs;
		if ( !this.opts.noReverse ) {

			// add reverse directions. TODO: this doesn't allow a reverse rate.
			dirs = dirs.concat( dirs.map(obj=>{
				return {dr:-obj.dr, dc:-obj.dc}
			}) );
		}

		for( let i = words.length-1; i >= 0; i-- ) {

			let w = words[i];

			// note: using used.length here makes it less likely for
			// begin/end portions of words to overlap. e.g. airport & portal sharing 'port'
			let place = this.placeBest( w, dirs, used.length );
			if ( place === null ) {
				unused.push( w );
			} else {
				//console.log('place: ' + place.row + ',' + place.col );
				this._puzzle.placeItem( w, place );

			}
		}

		this.unused = unused;

	}

}