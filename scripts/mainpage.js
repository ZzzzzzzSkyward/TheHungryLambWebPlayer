let mp;
let spinectn;

function MainPage() {
    if ( mp ) return;
    SpineObject();
}

function AddCtn() {
    if ( spinectn ) return spinectn;
    spinectn = Create( "div", null, "spinectn" );
    Append( spinectn );
    return spinectn;
}

function SpineObject() {
    AddCtn();
    let obj = new spine.SpinePlayer( "spinectn", {
        jsonUrl: "spine/CG.json", //json资源
        atlasUrl: "spine/CG.atlas", //贴图动画信息
        backgroundColor: "#00000000", // 设置背景颜色
        animations: [ 'idle' ], // 配置动画名称列表
        alpha: true, // 是否背景透明
        premultipliedAlpha: false,
        showControls: false, // 是否显示播放器控制台
        success: function ( player ) { //等success里面的player对象产生后，obj才有值，且和player一样
            console.log( player == obj )
            console.log( obj.animationState.data.skeletonData.animations, '1111' ) //动画列表
            //obj.setAnimation('touch1')//主动调用播放动画
            //player.skeleton.setAttachment("weapon", "sword");
            //player.animationState.setAnimation(0, "jump");
            //player.animationState.addAnimation(0, "walk", true, 0);
        }
    } );
    window.spineobj = obj;
}

function MP4() {
    AddCtn();
    let video = Create( "video", "mp4" );
    Append( video, spinectn );
    video.setAttribute( 'src', 'video/cg.webm' );
    window.spinevideo = video;
    //video.setAttribute( 'controls', 'true' );
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
}
let BGVIDEOS = [
    "[饿殍明末千里行_动态壁纸]“你喜欢满穗，还是穗_”.mp4",
    "满穗烟花V4.mp4", "穗穗.mp4", "maintheme.webm"
];

function BGVIDEO() {
    if ( window.bgvideo ) {
        Show( window.bgvideo );
        return window.bgvideo;
    }
    AddCtn();
    let video = Create( "video", "backgroundvideo" );
    Append( video );
    video.style.zIndex = -1;
    let v = BGVIDEOS[ Math.floor( Math.random() * BGVIDEOS.length ) ];
    if ( v ) {
        video.setAttribute( 'src', 'video/' + v );
    }
    window.bgvideo = video;
    //video.setAttribute( 'controls', 'true' );
    video.loop = true;
    video.muted = true;
    video.controls = false;
    video.autoplay = true;
    Request( function () {
        video.play();
    } );
    return video;
}

function VIDEO() {
    if ( window.maintheme ) {
        Show( window.maintheme );
        return window.maintheme;
    }
    AddCtn();
    let video = Create( "video", "maintheme" );
    Append( video, spinectn );
    video.setAttribute( 'src', 'video/maintheme.webm' );
    window.maintheme = video;
    //video.setAttribute( 'controls', 'true' );
    video.loop = true;
    video.controls = true;
    video.autoplay = true;
    Request( function () {
        video.play();
    } );
    return video;
}

function Show( el ) {
    if ( el.style.visibility === 'hidden' ) {
        console.log( 'Show', el );
        el.style.visibility = 'visible';
    }
}

function Hide( el ) {
    if ( el.style.visibility !== 'hidden' ) {
        console.log( 'Hide', el );
        el.style.visibility = 'hidden';
    }
}

function BG() {
    if ( window.bgimg ) {
        Show( window.bgimg );
        return;
    }
    AddCtn();
    let img = Create( "div", "backgroundimg" );
    Append( img, spinectn );
    img.style.backgroundImage = 'url("images/封面.webp")';
    window.bgimg = img;
    return img;
}

function LOGO() {
    AddCtn();
    let logo = Create( "div", "logo" );
    Append( logo, spinectn );
    logo.style.backgroundImage = 'url("images/logoZH.webp")';
    window.logo = logo;
    return logo;
}

function opening() {
    let fadet = 1.1;
    let finish = 1.2;
    let speed = 1 / 10000 / 2;
    let s = 1;
    let scale = 0.2;
    AddCtn();
    let openingctn = Create( "div", "openingctn" );
    let opening = Create( "div", "opening" );
    Append( openingctn, spinectn );
    Append( opening, openingctn );
    opening.style.backgroundImage = 'url("images/logo.webp")';
    window.opening = opening;
    let begin = new Date();
    let Fade = function ( pct ) {
        openingctn.style.opacity = ( 1 - pct ) * ( 1 - pct );
        if ( openingctn.style.opacity <= 1e-2 ) {
            openingctn.style.display = 'none';
        }
    };
    let fn = function () {
        let now = new Date();
        let elapse = now - begin;
        let s2 = elapse * speed;
        let sca = s2 * scale + s;
        s2 = s2 + s;
        opening.style.transform = `scale3d(${sca},${sca},${sca})`;
        if ( s2 < finish ) {
            requestAnimationFrame( fn );
        } else {
            Fade( 1 );
            PopStack( "opening" );
            RegisterGlobalKeybind();
        }
        if ( s2 >= fadet ) {
            Fade( ( s2 - fadet ) / ( finish - fadet ) );
        }
    }
    requestAnimationFrame( fn );
}

let togglebgm = true;

function ToggleSound() {
    //toggle bgm
    let soundsvg = Query( "soundicon" );
    togglebgm = !togglebgm;
    if ( togglebgm ) {
        PauseBGM();
        soundsvg.classList.add( "disabled" );
    } else {
        PlayBGM();
        soundsvg.classList.remove( "disabled" );
    }
}

function MenuButton( text ) {
    let el = Create( "div", "menubutton" );
    let t = Create( "p", "disable-select" );
    t.innerHTML = text;
    Append( t, el );
    el.addEventListener( "click", function ( e ) {
        el.clicked( e );
    } );
    return el;
}
let reader;

function CreateReader() {
    if ( reader ) return reader;
    reader = Create( "div", null, "reader" );
    Append( reader, spinectn );
    return reader;
}

function Read() {
    CreateStack( "reader", [ function () {
        CreateReader();
        Show( reader );
        return reader;
    } ], function () {
        clearData();
        Hide( reader );
    } );
    const fileInput = Query( 'fileInput' );
    fileInput.click();
}

function Play() {
    ScriptLoader.CreateStack();
    ScriptLoader.Upload();
}

function AddButtons() {
    //sound icon
    let soundsvg = Query( "soundicon" );
    Append( soundsvg, spinectn );
    soundsvg.addEventListener( "click", ToggleSound );
    //menu
    let menu = Create( "div", "menu" );
    Append( menu, spinectn );
    //json icon
    let jsonicon = MenuButton( "Read Split" );
    jsonicon.clicked = function () {
        globalLoadJSON = displayBoth;
        Read();
    };
    Append( jsonicon, menu );
    //json icon 2
    let cicon = MenuButton( "Read Combined" );
    cicon.clicked = function () {
        globalLoadJSON = displayCombined;
        Read();
    };
    Append( cicon, menu );
    //json icon 3
    let eicon = MenuButton( "Read English" );
    eicon.clicked = function () {
        globalLoadJSON = displayEng;
        Read();
    };
    Append( eicon, menu );
    //play icon
    let playicon = MenuButton( "Play" );
    playicon.clicked = Play;
    Append( playicon, menu );
    //video icon
    let maintheme = MenuButton( "Watch Video" );
    maintheme.clicked = ThemeVideoStack;
    Append( maintheme, menu );
    return menu;
}
let stacks = [];
window.screenstacks = stacks;
let pointer = 0;

function SameTop( name ) {
    let currentstack = null;
    if ( stacks.length )
        currentstack = stacks[ pointer - 1 ];
    if ( currentstack ) {
        if ( currentstack.name == name ) return true;
    }
    return false;
}

function CreateStack( name, fns, onexit, onenter ) {
    if ( SameTop( name ) ) return;
    let data = {
        name: name,
        screens: [],
        onexit: onexit,
        onenter: onenter
    }
    for ( let i of fns ) {
        let v = i();
        if ( v ) {
            data.screens.push( v );
        }
    }
    let prevstack = stacks[ pointer - 1 ];
    if ( prevstack ) {
        if ( prevstack.onexit ) {
            prevstack.onexit();
        }
    }
    stacks.push( data );
    console.log( 'Push', name );
    pointer++;
    return data;
}

function PopStack( name ) {
    if ( !SameTop( name ) ) return;
    console.log( 'Pop', name );
    let data = stacks[ pointer - 1 ];
    let scs = data.screens;
    if ( data.onexit ) {
        data.onexit();
    }
    for ( let i of scs ) {
        Hide( i );
    }
    pointer--;
    data = stacks[ pointer - 1 ];
    scs = data.screens;
    if ( data.onenter ) {
        data.onenter();
    }
    for ( let i of scs ) {
        Show( i );
    }
    if ( pointer >= 0 && pointer < stacks.length ) {
        for ( let i = pointer; i < stacks.length - 1; i++ ) {
            stacks[ i ] = stacks[ i + 1 ];
        }
    }
    stacks.pop();
    return scs;
}

function MainScreenStack() {
    CreateStack( "main", [
        //BG,
        BGVIDEO,
        //VIDEO,
        //MP4,
        LOGO,
        function () {
            PlayBGM( "饿殍主题曲" );
        },
        AddButtons,
        opening
    ], function () {
        PauseBGM();
    }, function () {
        PlayBGM();
    } );
}

function RegisterGlobalKeybind() {
    document.body.addEventListener( "keydown", function ( e ) {
        if ( e.key === 'Escape' ) {
            if ( pointer > 1 )
                PopStack( stacks[ pointer - 1 ].name );
        }
    } );
}

function ScriptScreenStack( file ) {
    AddCtn();
    CreateStack( "script", [
        opening
    ] );
    ScriptLoader.FetchAndPlay( file );
}

function ThemeVideoStack() {
    CreateStack( "maintheme", [
        VIDEO
    ], function () {
        window.maintheme.pause();
    } );
}
let audios = [
    "白日无光.m4a",
    "闯王行.m4a",
    "饿殍主题曲.m4a",
    "孤风凄雨.m4a",
    "孩童与风.m4a",
    "饥荒绝望.m4a",
    "狼的救赎.m4a",
    "旅途.m4a",
    "明末-白日无光.m4a",
    "明末-良穗相遇.m4a",
    "明末千里行.m4a",
    "明末-芸芸众生.m4a",
    "皮影戏.m4a",
    "燃血之时.m4a",
    "心近之刻.m4a",
]
let bgm;

function SetBGM( src ) {
    bgm = bgm || Query( "bgm" );
    bgm.src = src;
}

function PlayBGM( name ) {
    if ( !name ) {
        bgm.play();
        return;
    }
    if ( audios.includes( name ) ) {
        SetBGM( 'audio/' + name );
    } else if ( audios.includes( name + ".m4a" ) ) {
        SetBGM( 'audio/' + name + ".m4a" );
    } else {
        console.error( "Invalid bgm name: " + name );
    }
    Request( function () {
        if ( SameTop( "main" ) )
            bgm.play();
    } );
}

function PauseBGM() {
    bgm.pause();
}

function ResetBGM() {
    bgm.stop();
}
let globalLoadJSON;

function LoadJSON( fn ) {
    const fileInput = Query( 'fileInput' );
    fileInput.type = "file";
    fileInput.setAttribute( "multiple", "true" );
    //fileInput.setAttribute( "webkitdirectory", "true" );
    fileInput.accept = "application/json";
    fileInput.click();
    const file = fileInput.files[ 0 ];
    if ( !file ) return;

    const reader = new FileReader();
    reader.onload = function ( event ) {
        const data = JSON.parse( event.target.result );
        fn( data );
    };

    reader.readAsText( file );
}


function loadData() {
    const fileInput = document.getElementById( 'fileInput' );
    const file = fileInput.files[ 0 ];
    if ( !file ) return;

    const reader = new FileReader();
    reader.onload = function ( event ) {
        const data = JSON.parse( event.target.result );
        globalLoadJSON( data );
    };

    reader.readAsText( file );
}

function Line( name, content ) {
    let el = document.createElement( name );
    el.classList.add( 'line' );
    el.classList.add( 'trans' );
    if ( content ) {
        let rich = applyRichText( content );
        el.innerHTML = rich;
    }
    return el;
}

function OnTextClicked( event ) {
    const soundUrl = event.target.getAttribute( 'data-sound' );
    if ( soundUrl ) {
        let src = `AudioClip/${soundUrl}.m4a`;
        const voicea = Query( "voice" );
        voicea.src = src;
        voicea.play();
    }
}

function applyRichText( text ) {
    // 解析 <color> 标签
    text = text.replace( /<color=(#[A-Fa-f0-9]{6})>(.*?)(<\/color>|$)/g, '<span style="color: $1">$2</span>' );

    // 解析 <size> 标签
    text = text.replace( /<size=(\d+)>(.*?)(<\/size>|$)/g, '<span style="font-size: $1px">$2</span>' );

    return text;
}

function clearData() {
    let reader = Query( "reader" );
    reader.innerHTML = '';
}

function displayCombined( data ) {
    clearData();
    let id = 0;
    data.forEach( item => {
        id++;
        const originalText = Line( 'orig', item.original + "<br/>" + item.translation );
        originalText.setAttribute( 'data-index', item.key );
        item.sound = item.sound || ( item.command === "Line" ? item.arg3 : null );
        if ( item.sound ) {
            originalText.setAttribute( 'data-sound', item.sound );
            originalText.classList.add( 'sound' );
        }
        reader.appendChild( originalText );
        originalText.addEventListener( 'click', OnTextClicked );
    } );
    reader.classList.add( 'single' );
}

function displayBoth( data ) {
    reader.classList.remove( 'single' );
    reader.classList.add( 'double' );
    clearData();
    let id = 0;
    data.forEach( item => {
        id++;
        const originalText = Line( 'orig', item.original );
        originalText.setAttribute( 'data-index', item.key );
        item.sound = item.sound || ( item.command === "Line" ? item.arg3 : null );
        if ( item.sound ) {
            originalText.setAttribute( 'data-sound', item.sound );
            originalText.classList.add( 'sound' );
        }
        reader.appendChild( originalText );
        originalText.addEventListener( 'click', OnTextClicked );

        const translationText = Line( 'trans', item.translation );
        reader.appendChild( translationText );
    } );
}

function displayEng( data ) {
    reader.classList.add( 'single' );
    clearData();
    let id = 0;
    data.forEach( item => {
        id++;
        const originalText = Line( 'orig', item.translation );
        originalText.setAttribute( 'data-index', item.key );
        item.sound = item.sound || ( item.command === "Line" ? item.arg3 : null );
        if ( item.sound ) {
            originalText.setAttribute( 'data-sound', item.sound );
            originalText.classList.add( 'sound' );
        }
        reader.appendChild( originalText );
        originalText.addEventListener( 'click', OnTextClicked );
    } );
}