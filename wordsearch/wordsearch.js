import { SearchOpts } from './searchopts';
import { Puzzle } from '../core/puzzle';
import { TYPE_WORDSEARCH } from '../consts';
import { RangeKey } from '../core/range';

export class WordSearch extends Puzzle {

	toJSON(){

		let obj = super.toJSON();

		// words stored in chargrid.
		obj.words = this.words;

		return obj;

	}

	/**
	 * @property {string[]} words - words already placed in wordsearch.
	 */
	get words(){return this._words}
	set words(v){this._words=v;}

	/**
	 * @property {Map<string,string>} placed - maps position keys to objects
	 * placed in the grid.
	 * Used to stop repeated new words in invalid positons by preventing duplicate keys.
	 * In wordsearches this means identical words being placed in identical positions,
	 * in crosswords it means words with the same orientation overlapping each other.
	 */
	get placed(){return this._placed;}

	constructor( rows=10, cols=10 ) {

		super();

		this.type = TYPE_WORDSEARCH;

		this._placed = new Map();

		if ( typeof rows === 'number') {
			this.initGrid( rows, cols );
		} else if ( rows != null && typeof rows === 'object' ) {
			this.revive(rows);
		}
		// Vue reactivity.
		if (!this.words) this.words = null;

	}

	/**
	 * Revive from json.
	 */
	revive( json ){

		if ( json.opts ) this.opts = new SearchOpts(json.opts);

		super.revive(json);
		if ( json.words ) this._words = json.words;

	}

	/**
	 * Clear all placed words.
	 */
	clearPlaced(){

		if ( this._words ) this._words.length = [];
		if ( this._placed ) this.placed.clear();

	}

	placeItem( word, place ) {

		this._words.push(word);

		let len = word.length-1;
		this._placed.set( RangeKey( place.row, place.col, place.row+len*place.dr, place.col+len*place.dc), word );

	}

	canPlace( word, r, c, endR, endC ) {

		return !this._placed.has( RangeKey(r,c, endR, endC ) );
	}

	has( w ){ return this.words.includes(w); }

}