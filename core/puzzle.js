import {defineVars } from 'objecty';
import { CharGrid } from './chargrid';

/**
 * @class Puzzle Information about a puzzle.
 */
export class Puzzle {

	toString(){ return this.id||this.title||'untitled'; }

	toJSON(){

		return {
			id:this.id,
			type:this.type,
			url:this.url||undefined,
			title:this.title||undefined,
			creator:this._creator||undefined,
			difficulty:this._difficulty||undefined,
			grid:this._grid
		}

	}

	/**
	 * @property {string} id - id of object.
	 */
	get id(){return this._id; }
	set id(v){this._id=v}

	/**
	 * @property {string} url - url where object is stored.
	 */
	get url(){return this._url; }
	set url(v){this._url=v}

	/**
	 * @property {string} title - title of game/grid.
	 */
	get title(){return this._title;}
	set title(v){
		//console.log('setting title: ' + v );
		this._title=v
	}

	/**
	 * @property {string} type - type of puzzle (wordsearch,crossword,etc.)
	 */
	get type(){return this._type;}
	set type(v){this._type=v}

	/**
	 * @property {number} created - timestamp of date created.
	 */
	get created(){return this._created}
	set created(v){this._created=v}

	/**
	 * @property {string} creator - id of creator.
	 */
	get creator(){return this._creator; }
	set creator(v){this._creator=v}

	/**
	 * @property {string} difficulty - puzzle difficulty.
	 */
	get difficulty(){return this._difficulty; }
	set difficulty(v){this._difficulty=v}

	/**
	 * @property {CharGrid} grid - rows in puzzle.
	 */
	get grid(){return this._grid; }

	get rows(){ return this._grid ? this._grid.rows : -1; }
	get cols(){ return this._grid ? this._grid.cols : -1; }

	constructor(){

		this.title = '';
		this.difficulty = '';
		this.creator = '';
		this.created = 0;
		this.id = null;
		this.url = null;
		this._grid = null;	//reactivity.

		defineVars( this );

	}

	/**
	 *
	 * @param {number|object} rows
	 * @param {number|null} cols
	 */
	initGrid(rows, cols) {

		this._grid = new CharGrid(rows,cols);
		this._grid.canPlace = this.canPlace.bind(this);

		return this._grid;

	}

	/**
	 * Override in subclass.
	 */
	canPlace(){return true;}

	revive( vars ){

		//Object.assign( this, vars );
		this.id = vars.id || null;
		this.difficulty = vars.difficulty || null;
		this.title = vars.title || '';
		this.creator = vars.creator || '';
		this.url = vars.url || '';

		if ( vars.grid ) this.initGrid( vars.grid );
		else throw new Error('Missing wordsearch grid.');
	}

}