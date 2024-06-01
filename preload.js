const {
    clipboard
} = require( 'electron' )

async function ReadCB() {
    const text = clipboard.readText();
    if ( text.length > 50 ) {
        text = "(too long)";
    }
    return text;
}

function WriteCB( a ) {
    clipboard.writeText( a );
}
window.ReadCB = ReadCB;
window.WriteCB = WriteCB;
window.IsElectron = true;