function Create( tag, className, id ) {
    let el = document.createElement( tag || "div" );
    if ( className )
        el.className = className;
    if ( id ) el.id = id;
    return el;
}

function Append( el, parent ) {
    if ( !parent ) parent = document.body;
    parent.appendChild( el );
}

function Query( text ) {
    let result = document.querySelectorAll( text );
    if ( result.length == 1 ) return result[ 0 ];
    if ( result.length > 1 ) return result;
    result = document.querySelectorAll( '#' + text );
    if ( result.length == 1 ) return result[ 0 ];
    if ( result.length > 1 ) return result;
    result = document.querySelectorAll( '.' + text );
    if ( result.length == 1 ) return result[ 0 ];
    if ( result.length > 1 ) return result;
    return null;
}
let queuedrequests = [];
document.addEventListener( "DOMContentLoaded", () => {
    document.body.addEventListener( 'click', function () {
        for ( let i of queuedrequests ) {
            if ( typeof i === 'function' ) i();
        }
        queuedrequests = [];
    } )
} );

function Request( fn ) {
    //fn();
    queuedrequests.push( fn );
}

function LoopUntil( fn, until, finale, dt ) {
    let i;
    dt = dt || 0.1;
    let func = function () {
        if ( !until() ) fn();
        else {
            clearInterval( i );
            finale();
        }
    };
    i = setInterval( func, dt );
}
const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) );

function Next( fn, until, finale ) {
    requestAnimationFrame( fn );
}