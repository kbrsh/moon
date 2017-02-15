import { encode } from 'vlq';

export default function Mappings ( hires ) {
	const offsets = {
		generatedCodeColumn: 0,
		sourceIndex: 0,
		sourceCodeLine: 0,
		sourceCodeColumn: 0,
		sourceCodeName: 0
	};

	let generatedCodeLine = 0;
	let generatedCodeColumn = 0;

	this.raw = [];
	let rawSegments = this.raw[ generatedCodeLine ] = [];

	let pending = null;

	this.addEdit = ( sourceIndex, content, original, loc, nameIndex ) => {
		if ( content.length ) {
			rawSegments.push([
				generatedCodeColumn,
				sourceIndex,
				loc.line,
				loc.column,
				nameIndex,
			]);
		} else if ( pending ) {
			rawSegments.push( pending );
		}

		this.advance( content );
		pending = null;
	};

	this.addUneditedChunk = ( sourceIndex, chunk, original, loc, sourcemapLocations ) => {
		let originalCharIndex = chunk.start;
		let first = true;

		while ( originalCharIndex < chunk.end ) {
			if ( hires || first || sourcemapLocations[ originalCharIndex ] ) {
				rawSegments.push([
					generatedCodeColumn,
					sourceIndex,
					loc.line,
					loc.column,
					-1
				]);
			}

			if ( original[ originalCharIndex ] === '\n' ) {
				loc.line += 1;
				loc.column = 0;
				generatedCodeLine += 1;
				this.raw[ generatedCodeLine ] = rawSegments = [];
				generatedCodeColumn = 0;
			} else {
				loc.column += 1;
				generatedCodeColumn += 1;
			}

			originalCharIndex += 1;
			first = false;
		}

		pending = [
			generatedCodeColumn,
			sourceIndex,
			loc.line,
			loc.column,
			-1,
		];
	};

	this.advance = str => {
		if ( !str ) return;

		const lines = str.split( '\n' );
		const lastLine = lines.pop();

		if ( lines.length ) {
			generatedCodeLine += lines.length;
			this.raw[ generatedCodeLine ] = rawSegments = [];
			generatedCodeColumn = lastLine.length;
		} else {
			generatedCodeColumn += lastLine.length;
		}
	};

	this.encode = () => {
		return this.raw.map( segments => {
			let generatedCodeColumn = 0;

			return segments.map( segment => {
				const arr = [
					segment[0] - generatedCodeColumn,
					segment[1] - offsets.sourceIndex,
					segment[2] - offsets.sourceCodeLine,
					segment[3] - offsets.sourceCodeColumn
				];

				generatedCodeColumn = segment[0];
				offsets.sourceIndex = segment[1];
				offsets.sourceCodeLine = segment[2];
				offsets.sourceCodeColumn = segment[3];

				if ( ~segment[4] ) {
					arr.push( segment[4] - offsets.sourceCodeName );
					offsets.sourceCodeName = segment[4];
				}

				return encode( arr );
			}).join( ',' );
		}).join( ';' );
	};
}
