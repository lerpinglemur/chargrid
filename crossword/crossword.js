import { CharGrid } from "../chargrid";

export class Crossword extends CharGrid {

	toJSON(){

	}

	constructor( rows, cols ){

		super(rows,cols);

		this.allowDiagonal = false;
		this.allowReverse = false;

	}

	/**
	 *
	 * @param {Clue[]} clues
	 * @returns {Clue[]} unused clues.
	 * @throws {Error} Exception.
	 */
	placeClues( clues ) {

		console.time( 'Crossword' );

		if ( !Array.isArray(clues) ) throw new Error('Clues must be an array.');

		// fit large words first.
		let arr = clues.concat().sort((a,b)=>a.length-b.length);
		let unused = [];

		for( let i = arr.length-1; i >= 0; i-- ) {

			if ( !this.placeWord( arr[i] ) ) {
				unused.push(arr[i]);
			}
		}

		console.timeEnd( 'Crossword' );

		console.log('Clues not fitted: ' + unused.length );

		return unused;

	}

}