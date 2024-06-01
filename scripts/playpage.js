//脚本展示：哪个章节、哪句话、什么时刻
//用户输入：下一句、上一句、选句、自动
//图层：背景组、前景组、UI组
let ScriptLoader = {
    chapters: {},
    pointer: {
        chapter: null,
        time: -1,
        line: -1
    },
    last: {
        chapter: null,
        time: -2,
        line: -2
    },
    config: {
        //取最大值
        per_word: 50, //每个词多少毫秒
        duration: 1000, //一共多少毫秒

        interval: 2000, //停顿多少毫秒
        fps: 30, //多久刷新一次
        DisplayBoth: false, //双语
        OriginalFirst: true, //原文优先
        DisableTyping: false //禁用打字机
    },
    memory: {
        parent: null
    },
    images: [],
    chars: [],
    uis: [],
    inputblock: {},
    ui: null,
    bg: null,
    fg: null,
    soundvolume: 1,
    voicevolume: 0.6,
    autoread: false
};
//单例模式
window.ScriptLoader = ScriptLoader;
//this one loads the json data
ScriptLoader.Load = function ( name, jsondata ) {
    //process json like
    /*{
        "command": "Line",
        "arg1": "满穗",
        "arg2": null,
        "arg3": null,
        "arg4": null,
        "original": "[……]",
        "translation": " \"...\""
    }*/
    this.chapters[ name ] = jsondata;
    for ( let i of jsondata ) {
        let c = i.command;
        if ( !c ) c = "Line";
        if ( c.match( /[Bb]g/ ) && c.match( "黑场" ) ) {
            c = "Bg";
        }
        if ( c === "心理活动" ) {
            c = "FadeOut";
            i.arg1 = "rgba(0,0,0,0.3)";
            i.arg2 = "100";
        }
        if ( c === "心理活动-关" ) {
            c = "FadeIn";
            i.arg1 = "rgba(0,0,0,0.3)";
            i.arg2 = "100";
        }
        if ( c === "淡出" ) {
            c = "FadeOut";
            i.arg1 = "black";
        }
        if ( c === "背景音乐-关" ) {
            c = "StopAmbience";
        }

        i.command = c;
        if ( c === "Version" ) {
            this.LineCommands.Version.call( this, i.arg1 );
        } else if ( c === "Line" ) {
            //convert
            if ( i.arg2 && !i.original ) {
                i.original = i.arg2;
            }
            if ( i.arg3 ) {
                //special treat to redirect
                if ( !i.arg3.match( "AudioClip" ) ) {
                    i.arg3 = this.ResolveAbsolutePath( i.arg3, name );
                }
                this.PreloadAsset( 'audio', i.arg3 );
            }
            if ( i.arg4 ) {
                //special treat to redirect
                if ( !i.arg4.match( "Texture2D" ) ) {
                    i.arg4 = this.ResolveAbsolutePath( i.arg4, name );
                }
                this.PreloadAsset( 'img', this.FixSRC( i.arg4 ) );
            }
        } else if ( c === 'If' ) {
            try {
                i.arg1 = eval( "_=" + i.arg1 );
            } catch ( e ) {};
            i.arg2 = parseInt( i.arg2 );
            if ( !i.arg2 ) {
                delete i.arg2;
            }
        } else if ( c === "Selection" && typeof i.arg2 === "string" ) {
            if ( !this.config.version ) {

            } else {
                try {
                    i.arg2 = eval( "_=" + i.arg2 );
                } catch ( e ) {}
            }
        } else if ( c === 'BgVideo' ) {
            i.arg2 = i.arg2 === 'true';
            i.arg3 = i.arg3 === 'true';
            //special treat to redirect
            if ( !i.arg1.match( /^video/ ) ) {
                i.arg1 = this.ResolveAbsolutePath( i.arg1, name );
            }
            this.PreloadAsset( 'video', i.arg1 );
        } else if ( c === "Bg" ) {
            //special treat to redirect
            if ( !i.arg1.match( "Texture2D" ) ) {
                i.arg1 = this.ResolveAbsolutePath( i.arg1, name );
            }
            this.PreloadAsset( 'img', this.FixSRC( i.arg1 ) );
        } else if ( c === 'Jump' ) {
            i.arg1 = parseInt( i.arg1 );
            if ( i.arg1 >= 0 ) {} else {
                i.arg1 = "";
                i.command = "Line";
            }
        } else if ( c === 'Wait' ) {
            i.arg1 = parseInt( i.arg1 ) || 1000;
        } else if ( c === "FadeIn" || c === "FadeOut" ) {
            i.arg2 = parseInt( i.arg2 ) || 1000;
        } else if ( c === "CSS" ) {
            let el = Create( "style" );
            el.innerHTML = i.arg1;
            Append( el, this.preloadcontainer );
        }
    }
}
ScriptLoader.ResolveAbsolutePath = function ( path, jsonpath ) {
    //the json path is the same as the relative directory, so let's find it.
    let directory = jsonpath.replace( /[^/]+[.]json$/, '' ).replace( /^[.]?[/\\]?/, '' ).replace( /[/\\]+$/, '' );
    if ( directory ) {
        path = directory + '/' + path;
    }
    return path;
}
//this one load from disk, must be called from event
ScriptLoader.Upload = function () {
    this.uploader.click();
}
ScriptLoader.OnUpload = function () {
    let i = this.uploader;
    const file = i.files[ 0 ];
    if ( !file ) {
        this.StartUpdating();
        this.Show();
        return;
    };
    this.CreateStack();
    const name = file.name;
    let that = this;
    const reader = new FileReader();
    reader.onload = function ( event ) {
        const data = JSON.parse( event.target.result );
        that.Load( name, data );
        that.SeekChapter( name );
    };
    reader.readAsText( file );
}
ScriptLoader.PreloadAsset = function ( tag, url ) {
    let element = Create( tag, "preloadasset" );
    element.src = url;
    element.href = url;
    element.preload = true;
    element.autoplay = true;
    element.volume = 0;
    element.muted = true;
    element.controls = false;
    element.looped = false;
    element.lazy = false;
    Append( element, this.preloadcontainer );

    element.addEventListener( "load", function () {
        element.remove();
    } );

    element.addEventListener( "error", function () {
        console.error( `Error preloading asset ${url}` );
        element.remove();
    } );
    let el = Create( "link", "preloadassetlink" );
    el.rel = "preload";
    let ttype = tag;
    if ( tag === "img" ) ttype = "image";
    el.as = ttype;
    el.href = url;
    Append( el, this.preloadcontainer );
};
ScriptLoader.FetchAndPlay = function ( url ) {
    let that = this;
    return new Promise( ( resolve, reject ) => {
        fetch( url )
            .then( response => {
                if ( !response.ok ) {
                    reject( new Error( `HTTP error! status: ${response.status}` ) );
                }
                return response.json();
            } )
            .then( data => {
                // Call handler with parsed data and resolve the Promise
                if ( !that.scene )
                    that.Enter();
                that.Load( url, data );
                that.SeekChapter( url );
                that.StartUpdating();
                resolve( data );
            } )
            .catch( error => {
                // Reject the Promise with the error
                reject( error );
            } );
    } );
};
//must be called from event?
ScriptLoader.Download = function ( name ) {
    let data = this.chapters[ name ];
    if ( !data ) return;
    let string = JSON.stringify( data );
    let node = Create( "a" );
    const blob = new Blob( [ string ], {
        type: "application/json;charset=utf-8"
    } );
    const url = URL.createObjectURL( blob );
    a.href = url;
    a.download = true;
    Append( node );
    node.click();
    node.remove();
}
ScriptLoader.SeekChapter = function ( name ) {
    if ( !this.chapters[ name ] ) return;
    this.pointer.chapter = name;
    //选章节之后立刻前往第一句话
    this.SeekLine( 0 );
}
ScriptLoader.SeekLine = function ( id ) {
    if ( id < 0 ) id = 0;
    if ( this.chapters[ this.pointer.chapter ] && id >= this.chapters[ this.pointer.chapter ].length ) id = this.chapters[ this.pointer.chapter ].length - 1;
    this.pointer.line = id;
    this.SeekTime( 0 );
}
ScriptLoader.SeekTime = function ( t ) {
    if ( t < 0 || t > this.config.duration ) return;
    this.pointer.time = t;
}
ScriptLoader.StartUpdating = function () {
    if ( !this.updating ) {
        this.updating = true;
        //Next( function () {
        //    that.OnUpdate()
        //} );
        let that = this;
        this.interval = this.interval || setInterval( function () {
            that.OnUpdate();
        }, Math.floor( 1000 / this.config.fps ) );
    }
}
ScriptLoader.AdvanceTime = function () {
    let t = new Date();
    let ot = this.lasttime || t;
    let dt = t - ot;
    let pt = this.time || 0;
    this.time = pt + dt;
    this.pointer.time += dt;
    this.lasttime = t;
}
ScriptLoader.OnUpdate = function () {
    if ( !this.updating ) return;
    let that = this;
    //Next( function () {
    //    that.OnUpdate()
    //} );
    this.AdvanceTime();
    this.ActualUpdate();
}
ScriptLoader.StopUpdating = function () {
    this.updating = false;
    if ( this.interval ) {
        clearInterval( this.interval );
        this.interval = null;
    }
}
ScriptLoader.ImmediateUpdate = function () {
    this.ActualUpdate();
}
ScriptLoader.CheckLine = function ( ch, li ) {
    let data = this.chapters[ ch ]
    if ( !data ) return;
    data = data[ li ];
    if ( !data ) return;
    return this.LineCommands[ data.command || "" ];
}
ScriptLoader.ActualUpdate = function () {
    let p = this.pointer;
    let c = p.chapter;
    let l = p.line;
    let t = p.time;
    if ( !c ) return;
    if ( !l ) l = 0;
    if ( !t ) t = 0;
    let lp = this.last;
    let lc = lp.chapter;
    let ll = lp.line;
    let lt = lp.time;
    if ( !lc ) lc = "";
    if ( !ll ) ll = 0;
    if ( !lt ) lt = 0;
    //首先比较章节
    if ( c === lc ) {
        //相同章节，只需要顺序执行指令
    } else {
        //还原句子
        ll = -1; //章节句子的起始状态是不同的
        lt = 0; //句子的起始状态是相同的，都是空白
        this.SetChapter( c );
        this.pointer.chapter = c;
    }
    //其次比较句子
    if ( l === ll ) {
        //相同句子，不需要改变图层
    } else {
        //不同句子，需要执行指令
        //重置时间
        lt = 0;
        //寻找一条可执行的指令
        let it;
        let final = this.pointer.line;
        if ( ll < l ) {
            //前进
            for ( it = Math.max( 0, ll + 1 ); it <= ( this.chapters[ c ] ? this.chapters[ c ].length : 100 ); it++ ) {
                let result = this.CheckLine( c, it );
                if ( result ) {
                    final = this.SetLine( it, c )
                    if ( typeof final === "number" )
                        break;
                }
            }
        } else {
            //后退
            for ( it = ll - 1; it >= Math.max( l, 0 ); it-- ) {
                let result = this.CheckLine( c, it );
                if ( result ) {
                    final = this.SetLine( it, c )
                    if ( typeof final === "number" )
                        break;
                }
            }
        }
        this.pointer.line = final || it; //手动更新
    }
    //最后比较时间
    if ( lt === t ) {
        //啥都不干
    } else {
        //更新句子位置
        this.SetTime( t );
        this.pointer.time = t;
    }
}
let emptyLine = {
    line: null,
    title: null
};
ScriptLoader.ResolveLine = function ( l, c ) {
    let data = l;
    if ( typeof l === "number" ) {
        data = this.chapters[ c ];
        if ( !data ) return emptyLine;
        data = data[ l ];
        if ( !data ) return emptyLine;
        if ( data.command !== "Line" ) return emptyLine;
    } else {

    }
    let line = data.translation;
    if ( this.config.OriginalFirst ) {
        line = data.original;
    }
    if ( !line ) {
        line = data.original;
    } else {
        if ( this.config.DisplayBoth && !this.OriginalFirst && data.original ) {
            line = line + "<br/>" + data.original;
        }
    }
    if ( !line ) {
        line = '';
    }
    line = applyRichText( line );
    let title = data.title || data.arg1;
    if ( title )
        title = applyRichText( title );
    return {
        line,
        title
    };
}
ScriptLoader.UpdateFinishSign = function () {
    if ( this.last.finish && this.linecontent.innerText.length > 0 ) {
        this.ui.classList.add( "linefinish" )
    } else {
        this.ui.classList.remove( "linefinish" )
    }
    let f = Create( "final" );
    Append( f, this.linecontent );
}
ScriptLoader.FinishLine = function () {
    this.last.finish = true;
    this.UpdateFinishSign();
};
ScriptLoader.UnfinishLine = function ( cut ) {
    this.last.finish = false;
    this.UpdateFinishSign();
    this.CutText( cut );
};
ScriptLoader.cutTextRecursive = function ( node, len ) {
    if ( node.nodeType === Node.TEXT_NODE ) {
        let l = node.textContent.length;
        this.characterCount += l;
        if ( this.characterCount >= len ) {
            if ( this.characterCount > len )
                node.textContent = node.textContent.substring( 0, len - ( this.characterCount - l ) );
            while ( node.nextSibling ) {
                node.parentNode.removeChild( node.nextSibling );
            }
            return;
        }
    } else {
        for ( const child of node.childNodes ) {
            this.cutTextRecursive( child, len );
        }
    }
}
ScriptLoader.CutText = function ( len ) {
    this.characterCount = 0;
    this.cutTextRecursive( this.linecontent, len );
}
ScriptLoader.SetTime = function ( t ) {
    this.last.time = t;
    let {
        line,
        title
    } = this.ResolveLine( this.pointer.line, this.pointer.chapter );
    if ( line ) {
        if ( this.last.title !== title ) {
            this.last.title = title;
            if ( title ) {
                this.linetitle.style.opacity = 1;
                if ( this.config.OriginalFirst ) {} else {
                    title = EnglishNames[ title ] || title;
                }
                this.linetitle.innerHTML = title;
            } else {
                this.linetitle.style.opacity = 0;
            }
        }
        if ( !this.last.finish ) {
            this.linecontent.innerHTML = line;
            let actualtext = this.linecontent.innerText;
            let len = actualtext.length;
            let dur = this.GetLineDuration( actualtext );
            let pred = Math.min( 1, Math.max( 0, t / dur ) );
            let end = Math.round( pred * len );
            if ( len <= end || this.config.DisableTyping ) {
                this.FinishLine();
            } else {
                this.UnfinishLine( end );
            }
        }
    }
}
ScriptLoader.GetLineDuration = function ( line ) {
    let len = line.length;
    let predict_per_word = this.config.per_word * len;
    let predict_duration = this.config.duration;
    return Math.max( predict_duration, predict_per_word );
}
/*
    Version                 1
    CharacterOff            清除前景人物贴图
    ChapterTitle            位于画面中央的大号文字【参数1 台词】
    ChapterTitleOff         清除标题
    DialogueOn              打开台词
    DialogueOff             关闭台词
    DialogueBgOn            显示台词背景
    DialogueBgOff           隐藏台词背景
    Ambience                播放背景音乐【参数1 音乐文件相对路径】
    StopAmbience            停止背景音乐
    Jump                    跳转【参数1 行号】
    Bg                      背景图【参数1 图片文件相对路径】
    BgVideo                 背景视频【参数1 视频文件相对路径】
    Wait                    等待【参数1 时长】
    FadeIn                  从黑场淡入【参数1 颜色，参数2 时长】
    FadeOut                 淡出到黑场【参数1 颜色，参数2 时长】
    If                      控制流跳转【参数1 一个函数，参数2 行号】
    Selection               选项，所有选项必须是连续的行，有多少选项就写多少行【参数1 台词，参数2 一个函数，选择这个选项后会执行这个函数】
    Animation               播放动画，比如章节开头的动画【参数1 动画文件相对路径】
    Line（默认类型）          台词【参数1 名字，参数2 台词，参数3 语音文件相对路径，参数4 人物贴图相对路径】
*/
ScriptLoader.LineCommands = {
    Version: function ( arg1 ) {
        if ( arg1 == 1 ) {
            this.config.version = 1;
        } else {
            this.config.version = arg1;
        }
    },
    CharacterOff: function () {
        this.ClearCharacters();
    },
    DialogueBgOff: function () {
        this.setProperty( "dialogctn", "--background", "transparent" );
    },
    DialogueBgOn: function () {
        this.setProperty( "dialogctn", "--background", this.dialogctn.style.getProperty( "--original-background" ) );
    },
    Ambience: function ( arg1 ) {
        //@param arg1 String
        //hack now
        if ( !arg1 ) {
            this.ResumeSound();
        } else {
            if ( !this.config.version ) {

                arg1 = arg1.replace( /[_]?可循环/, "" );
                arg1 = 'audio/' + arg1 + '.m4a';
            }
            this.PlaySound( arg1 );
        }
    },
    StopAmbience: function () {
        this.StopSound();
    },
    Jump: function ( arg1 ) {
        //@param arg1 integer
        if ( typeof arg1 !== "number" ) return;
        this.SeekLine( arg1 );
        this.SetLine( arg1 );
    },
    Bg: function ( arg1 ) {
        //@param arg1 string the path of the background image
        //Currently there can only be one bg and throughout, there is no time when there is no background image
        this.ClearImages();
        this.AddImage( arg1 );
    },
    BgVideo: function ( arg1 ) {
        //@param arg1 string the path of the background video
        this.ClearImages();
        this.AddImageVideo( arg1 );
    },
    Wait: function ( arg1 ) {
        return;
        //it causes nuiance now
        //@param arg1 float
        this.Wait( arg1 );
    },
    ChapterTitle: function ( arg1 ) {
        this.AddTitle( arg1 );
    },
    ChapterTitleOff: function () {
        this.ClearTitle();
    },
    DialogueOn: function () {
        this.dialogctn.classList.remove( 'off' );
    },
    DialogueOff: function () {
        this.dialogctn.classList.add( 'off' );
    },
    FadeIn: function ( arg1, arg2 ) {
        //@param arg1 string color
        //@param arg2 float
        if ( typeof arg1 !== "string" ) arg1 = "rbga(0, 0, 0, 1)";
        if ( typeof arg2 !== "number" ) {
            arg2 = parseFloat( arg2 );
        }
        if ( typeof arg2 !== "number" ) arg2 = 1000;
        this.Fade( arg1, arg2, true );
    },
    FadeOut: function ( arg1, arg2 ) {
        //@param arg1 string color
        //@param arg2 float
        if ( typeof arg1 !== "string" ) arg1 = "rbga(0, 0, 0, 1)";
        if ( typeof arg2 !== "number" ) arg2 = 1000;
        this.Fade( arg1, arg2, false );
    },
    If: function ( arg1, arg2 ) {
        //@param arg1 function
        //@param arg2 integer
        let res = typeof ( arg1 ) === "function" && arg1.call( this.memory );
        if ( res && typeof arg2 === "number" ) {
            this.SeekLine( arg2 );
            this.SetLine( arg2 );
            return true;
        }
    },
    Animation: function ( arg1 ) {
        //@param arg1 string
        if ( !arg1 ) {
            this.ResumeVideo();
        } else {
            this.StopSound();
            this.StopVoice();
            this.PlayVideo( arg1 );
        }
    },
    Line: function ( arg1, arg2, arg3, arg4 ) {
        //@param arg1 name
        //@param arg2 line
        //@param arg3 voice
        //@param arg4 character

        //arg1 and arg2 are left to SetTime to handle
        if ( arg3 ) {
            if ( !this.config.version ) {
                //Fix Sui's voice
                if (
                    this.pointer.chapter.match( '良' ) &&
                    arg3.match( '穗' ) ) {
                    arg3 = arg3.replace( /[满]?穗/, "满穗" );
                }
            }
            this.PlayVoice( arg3 );
        }
        if ( arg4 ) {
            this.ClearCharacters();
            this.AddCharacter( arg4 );
        }
    },
    Selection: function ( arg1 ) {
        //handled by SetLine
    }
};
ScriptLoader.IsDurable = {
    Line: true,
    FadeIn: true,
    FadeOut: true,
    ChapterTitle: true,
    ChapterTitleOff: true
};
ScriptLoader.GetDuration = function ( cmd, data ) {
    let durable = this.IsDurable[ cmd ];
    if ( !durable ) return null;
    if ( cmd === "Line" ) {
        //如果有音频，就不要自动
        if ( data.arg3 ) {
            return 10000000;
        }
        if ( data.arg2 )
            return this.GetLineDuration( data.arg2 );
        return null;
    }
    if ( cmd === "FadeIn" || cmd === "FadeOut" ) return data.arg2 || 1000;
    if ( cmd === "ChapterTitle" || cmd === "ChapterTitleOff" ) return 1000;
    return this.config.interval;
}
ScriptLoader.Prefetch = function ( l, c ) {
    c = c || this.pointer.chapter;
    let data = this.chapters[ c ][ l ];
    let cdata = this.chapters[ c ][ this.last.line ];
    if ( !data ) return;
    if ( !cdata ) return;
    let t = data.command;
    if ( t === "Bg" && cdata.command === "FadeOut" ) {
        //4 args at most
        let success = this.LineCommands[ t ].call( this, data.arg1, data.arg2, data.arg3, data.arg4 );
        if ( success ) return this.pointer.line;
    }
};
ScriptLoader.SetLine = function ( l, c ) {
    c = c || this.pointer.chapter;
    this.last.line = l;
    let data = this.chapters[ c ][ l ];
    //prefetch
    this.Prefetch( l + 1, c );
    let t = data.command;
    //4 args at most
    let cmd = this.LineCommands[ t ];
    if ( !cmd ) return;
    let success = cmd.call( this, data.arg1, data.arg2, data.arg3, data.arg4 );
    //auto read
    if ( this.autoread ) {
        if ( t === "Line" && data.arg3 ) {
            this.WaitAudio();
        } else {
            let time = this.GetDuration( t, data ) + this.config.interval;
            if ( time )
                this.WaitNextLine( time );
        }
    }
    if ( success ) return this.pointer.line;
    //Selection
    if ( t === "Selection" ) {
        this.ClearSelection();
        let data = this.chapters[ c ];
        while ( data[ l ] && data[ l ].command === "Selection" ) {
            l--;
        }
        l++;
        while ( data[ l ] && data[ l ].command === "Selection" ) {
            this.AppendSelection( data[ l ] );
            l++;
        }
        this.ShowSelection();
    } else if ( t === "Line" ) {
        this.last.finish = false;
        this.HideSelection();
    }
    if ( t === 'Line' ) return l;
    if ( t === 'Selection' ) return this.last.line;
    if ( t === 'FadeIn' ) return l;
    if ( t === 'FadeOut' ) return l;
    if ( t === 'ChapterTitle' ) return l;
    if ( t === 'ChapterTitleOff' ) return l;
}
ScriptLoader.Current = function () {
    let last = this.last;
    let l = last.line;
    let c = last.chapter;
    let data = this.chapters[ c ][ l ];
    return data;
}
ScriptLoader.SetChapter = function ( c ) {
    this.last.chapter = c;
    //不同章节，需要清空图层
    this.StopSound();
    this.StopVideo();
    this.StopVoice();
    this.ClearImages();
    this.ClearCharacters();
    this.ClearSelection();
    this.HideSelection();
    this.SeekLine( 0 );
}
ScriptLoader.SetProperty = function ( which, name, value ) {
    this[ which ].style.setProperty( name, value );
};
ScriptLoader.AddTitle = function ( t, c ) {
    if ( !t ) {
        this.SetProperty( "title", "--titlecolor", "transparent" );
        this.SetProperty( "title", "opacity", 0 );
    } else {
        this.SetProperty( "title", "opacity", 1 );
        if ( c ) {
            this.SetProperty( "title", "--titlecolor", c );
        } else {
            this.SetProperty( "title", "--titlecolor", "" );
        }
        this.title.innerHTML = applyRichText( t );
    }
}
ScriptLoader.ClearTitle = function () {
    this.AddTitle();
}
ScriptLoader.Wait = async function ( t ) {
    await sleep( t );
}
ScriptLoader.ClearImages = function () {
    while ( this.images[ 0 ] ) {
        this.RemoveImage( this.images.length - 1 );
    }
}
ScriptLoader.ClearCharacters = function () {
    while ( this.chars[ 0 ] ) {
        this.RemoveCharacter( this.chars.length - 1 );
    }
}
ScriptLoader.RemoveImage = function () {
    let img = this.images.pop();
    if ( !img ) return;
    img.classList.add( 'off' );
    let timeout = 1000; //to match the css
    setTimeout( () => {
        img.remove();
    }, timeout );
}
ScriptLoader.RemoveCharacter = function ( id ) {
    let img = this.chars.pop();
    if ( !img ) return;
    img.classList.add( 'off' );
    let timeout = 1000; //to match the css
    setTimeout( () => {
        img.remove();
    }, timeout );
}
ScriptLoader.FixSRC = function ( src ) {
    if ( !this.config.version ) {
        src = src
            .replace( /小哑巴/, '满穗' )
            .replace( /第一只小羊/, '红儿' )
            .replace( /第二只小羊/, '翠儿' )
            .replace( /第三只小羊/, '琼华' )
            .replace( /第五只小羊？/, '满穗' )
            .replace( /“大哥”/, '闯王' );
        if ( !src.match( "Texture2D" ) )
            src = `Texture2D/${src}.webp`;
    }
    return src;
}
ScriptLoader.AddImage = function ( src ) {
    if ( typeof src !== 'string' ) {
        //this is an element, and may be a fade
        let id = this.images.length;
        if ( !this.images.includes( src ) )
            this.images.push( src );
        Append( src, this.bg );
        return id;
    }
    let img = Create( "img", "bgimg" );
    img.setAttribute( "alt", "Background" + src );
    src = this.FixSRC( src );
    console.log( "Add Background", src );
    img.setAttribute( "src", src );
    Append( img, this.bg );
    let id = this.images.length;
    if ( !this.images.includes( img ) )
        this.images.push( img );
    return id;
}
ScriptLoader.AddImageVideo = function ( src, loop, muted ) {
    if ( typeof src !== 'string' ) {
        //this is an element, and may be a fade
        let id = this.images.length;
        if ( !this.images.includes( src ) )
            this.images.push( src );
        Append( src, this.bg );
        return id;
    }
    let video = Create( "video", "bgimg" );
    video.muted = !!muted;
    video.loop = !!loop;
    video.autoplay = true;
    video.setAttribute( "alt", "Background Video" + src );
    //src = this.FixSRC( src );
    console.log( "Add Background Video", src );
    video.setAttribute( "src", src );
    Append( video, this.bg );
    let id = this.images.length;
    if ( !this.images.includes( video ) )
        this.images.push( video );
    return id;

}
ScriptLoader.AddCharacter = function ( src ) {
    let img = Create( "img", "char" );
    img.setAttribute( "alt", "Character" + src );
    src = this.FixSRC( src );
    img.setAttribute( "src", src );
    console.log( "Add Character", src );
    Append( img, this.fg );
    let id = this.chars.length;
    this.chars.push( img );
    return id;
}
ScriptLoader.ShowUI = function () {
    if ( this.uihidden ) {
        this.uihidden = false;
        this.ui.classList.remove( "hidden" );
        this.ui.classList.add( "showing" );
    }
    this.ClearHideTask();
}
ScriptLoader.ClearHideTask = function () {
    if ( this.hidetask ) {
        clearTimeout( this.hidetask );
        this.hidetask = null;
    }
}
ScriptLoader.UIHidden = function () {
    this.ui.classList.add( "hidden" );
    this.ClearHideTask();
}
ScriptLoader.HideUI = function () {
    if ( !this.uihidden ) {
        this.uihidden = true;
        this.ui.classList.remove( "showing" );
        this.ui.classList.add( "hiding" );
        this.hidetask = this.hidetask || setTimeout( function () {
            this.UIHidden();
        }, this.hiddenduration );
    }
}
ScriptLoader.Exit = function () {
    this.StopUpdating();
    this.ClearCharacters();
    this.ClearImages();
    this.StopVoice();
    this.StopSound();
    this.StopVideo();
    this.HideUI();
}
//initialize UI
ScriptLoader.Enter = function () {
    this.memory.parent = this;
    let scene = Create( "scene" );
    this.fade = Create( "div", "fade" );
    this.title = Create( "div", "chaptertitle" );
    let ui = Create( "ui" );
    let bg = Create( "bg" );
    let fg = Create( "fg" );
    let sel = Create( "sel" );
    //hard coded parent
    AddCtn();
    let parent = Query( "spinectn" );
    //layer
    Append( scene, parent );
    Append( bg, scene );
    Append( fg, scene );
    Append( this.fade, scene );
    Append( this.title, scene );
    Append( ui, scene );
    Append( sel, ui );
    this.selection = sel;
    this.HideSelection();
    //ui
    let dialogctn = Create( "dialogctn", "dialoguectn" );
    let linectn = Create( "linectn", "linectn" );
    this.linecontainer = linectn;
    let lineTitle = Create( "linetitle", "linetitle" );
    this.linetitle = lineTitle;
    let lineContent = Create( "linecontent", "linecontent" );
    this.linecontent = lineContent;
    Append( dialogctn, ui );
    Append( linectn, dialogctn );
    Append( lineContent, linectn );
    Append( lineTitle, linectn );
    //bg
    //none
    //fg
    //none
    this.scene = scene;
    this.ui = ui;
    this.bg = bg;
    this.fg = fg;
    this.dialogctn = dialogctn;
    //sound
    this.sound = Create( "audio" );
    this.sound.autoplay = true;
    this.sound.loop = true;
    this.sound.muted = false;
    this.sound.controls = false;
    Append( this.sound );
    //video
    this.video = Create( "video" );
    this.video.autoplay = true;
    this.video.loop = false;
    this.video.muted = false;
    this.video.controls = false;
    Append( this.video );
    this.StopVideo();
    //voice
    this.voice = Create( "audio" );
    this.voice.autoplay = true;
    this.voice.loop = false;
    this.voice.muted = false;
    this.voice.controls = false;
    Append( this.voice );
    let uploader = Create( "input" );
    let that = this;
    uploader.addEventListener( "change", function ( e ) {
        that.OnUpload();
    } );
    Append( uploader );
    uploader.type = "file";
    uploader.accept = "application/json";
    this.uploader = uploader;
    //keybind
    document.body.addEventListener( "keydown", async function ( event ) {
        if ( that.blockinput ) return;
        switch ( event.key ) {
            case "ArrowLeft":
            case "ArrowUp":
                that.PrevLine();
                break;
            case "ArrowRight":
            case "ArrowDown":
            case " ":
            case "":
                that.NextLine();
                break;
            case "j":
            case "J":
                if ( confirm( "Will get the key from your clipboard and jump to there." ) ) {
                    let text = await ReadCB();
                    console.log( text );
                    that.SeekKey( text );
                }
                break;
            case "C":
            case "c":
                let k = that.chapters[ that.pointer.chapter ][ that.pointer.line ];
                if ( k && k.key ) {
                    alert( `Key [${k.key}] copied to your clipboard.` );
                    WriteCB( k.key )
                }
                break;
            case "A":
            case "a":
                that.AutoRead( !that.autoread );
                break;
        }
    } );

    document.body.addEventListener( "wheel", function ( event ) {
        if ( that.blockinput ) return;
        if ( event.deltaY > 0 ) {
            that.NextLine();
        } else {
            that.PrevLine();
        }
    } );

    document.body.addEventListener( "click", function ( event ) {
        if ( that.blockinput ) return;
        if ( event.button === 0 ) {
            that.NextLine();
        } else if ( event.button === 2 ) {
            that.PrevLine();
        }
    } );
    this.preloadcontainer = Create( "div", "preloadcontainer" );
    Append( this.preloadcontainer, scene );
    return scene;
}
ScriptLoader.PrevLine = function () {
    if ( this.updating ) {
        this.SeekLine( ( this.last.line || 0 ) - 1 );
    }
}
ScriptLoader.SeekKey = function ( key ) {
    if ( !key ) return;
    let data = this.chapters[ this.pointer.chapter ];
    for ( let i = 0; i < data.length; i++ ) {
        if ( data[ i ].key === key ) {
            this.SetLine( i );
            this.SeekLine( i );
            return;
        }
    }
    alert( "Key not found in this chapter." );
}
ScriptLoader.NextLine = function () {
    if ( this.updating ) {
        this.SetTime( this.config.duration );
        let d = this.chapters[ this.pointer.chapter ];
        if ( this.last.line >= ( d ? d.length : 0 ) - 1 ) {
            alert( "Chapter End." );
        }
        this.SeekLine( ( this.last.line || 0 ) + 1 );
    }
}
//auto
ScriptLoader.AutoRead = function ( enabled ) {
    this.autoread = enabled;
    if ( this.autoread ) {
        this.WaitNextLine( 0 );
    } else {
        this.CancelNextLine();
    }
}
ScriptLoader.WaitNextLine = function ( t ) {
    if ( !t ) {
        console.log( "no time" );
        return;
    }
    this.CancelNextLine();
    let that = this;
    this.autoreadtask = setTimeout( function () {
        if ( that.autoread ) {
            that.NextLine();
        }
        that.CancelNextLine();
    }, t );
}
ScriptLoader.CancelNextLine = function () {
    if ( this.autoreadtask ) {
        clearInterval( this.autoreadtask );
        this.autoreadtask = null;
    }
}
ScriptLoader.WaitAudio = function () {
    this.CancelNextLine();
    const audio = this.voice;
    let timeoutId;
    let that = this;

    const handleAudioEnd = () => {
        clearTimeout( timeoutId );
        audio.removeEventListener( 'ended', handleAudioEnd );
        audio.removeEventListener( 'error', handleAudioEnd );
        that.WaitNextLine( that.config.interval );
    };

    audio.addEventListener( 'ended', handleAudioEnd );
    audio.addEventListener( 'error', handleAudioEnd );
}
//called
ScriptLoader.CreateStack = function () {
    if ( this.scene ) {
        Show( this.scene );
    } else {
        this.Enter();
    }
    let that = this;
    CreateStack( "scene", [ function () {
        that.StartUpdating();
        that.Show();
        //hide the intro
        let intro = Query( "intro" );
        if ( intro ) {
            Hide( intro );
        }
        return that.scene;
    } ], function () {
        that.StopUpdating();
        that.Hide();
    }, function () {
        that.StartUpdating();
        that.Show();
    } );
}
ScriptLoader.BlockInput = function ( source, value ) {
    this.inputblock[ source ] = value;
    this.blockinput = false;
    for ( let i in this.inputblock ) {
        if ( this.inputblock.hasOwnProperty( i ) ) {
            if ( this.inputblock[ i ] ) {
                this.blockinput = true;
                return;
            }
        }
    }
}
ScriptLoader.Hide = function () {
    this.scene.style.display = 'none';
    this.sound.volume = 0;
    this.voice.volume = 0;
    this.BlockInput( "hide", true );
}
ScriptLoader.Show = function () {
    this.scene.style.display = 'flex';
    this.sound.volume = this.soundvolume;
    this.voice.volume = this.voicevolume;
    this.BlockInput( "hide", false );
}
//sound, bgm, Ambience
ScriptLoader.PlaySound = function ( src ) {
    this.sound.src = src;
    this.ResumeSound();
};
ScriptLoader.ResumeSound = function () {
    let that = this;
    this.soundplaying = true;
    Request( function () {
        if ( that.soundplaying ) {
            that.sound.play();
        }
    } );
    LoopUntil( function () {
        that.sound.volume = Math.min( 1, that.sound.volume + 0.01 );
    }, function () {
        return !that.soundplaying ||
            that.sound.volume >= that.soundvolume;
    }, function () {
        if ( that.soundplaying )
            that.sound.volume = that.soundvolume;
    } );
}
ScriptLoader.StopSound = function () {
    this.soundplaying = false;
    let that = this;
    LoopUntil( function () {
        that.sound.volume = Math.max( 0, that.sound.volume - 0.01 );
    }, function () {
        return that.soundplaying ||
            that.sound.volume <= 0;
    }, function () {
        if ( !that.soundplaying )
            that.sound.pause();
    } );
}
//video
ScriptLoader.PlayVideo = function ( src ) {
    this.video.src = src;
    this.ResumeVideo();
};
ScriptLoader.ResumeVideo = function () {
    let that = this;
    this.videoplaying = true;
    Show( this.video );
    this.video.play();
}
ScriptLoader.StopVideo = function () {
    this.videoplaying = false;
    let that = this;
    if ( !that.videoplaying )
        that.video.pause();
    Hide( this.video );
}
//voice
ScriptLoader.PlayVoice = function ( src ) {
    this.voice.src = src;
    this.ResumeVoice();
};
ScriptLoader.ResumeVoice = function () {
    this.voice.volume = this.voicevolume;
    this.voiceplaying = true;
    this.voice.play();
}
ScriptLoader.StopVoice = function () {
    this.voiceplaying = false;
    let that = this;
    if ( !that.voiceplaying )
        that.voice.pause();
}
//fade
ScriptLoader.Fade = function ( color, timing, enter ) {
    let f = this.fade;
    f.style.transitionDuration = '0s';
    f.style.backgroundColor = color;
    f.style.visibility = "visible";
    f.style.opacity = enter ? 1 : 0;
    let that = this;
    Next( function () {
        Next( function () {
            f.style.transitionDuration = ( timing / 1000 ) + 's';
            f.style.opacity = enter ? 0 : 1;
            if ( enter ) {
                that.HideFade( timing );
            } else {
                that.CancelHideFade();
            }
        }, 1 );
    } );
}
ScriptLoader.HideFade = function ( timing ) {
    let f = this.fade;
    this.fadetask = this.fadetask || setTimeout( function () {
        f.style.visibility = "hidden";
    }, timing );
}
ScriptLoader.CancelHideFade = function () {
    if ( this.fadetask ) {
        clearTimeout( this.fadetask );
        this.fadetask = null;
    }
}
ScriptLoader.ClearSelection = function () {
    this.selection.innerHTML = '';
}
ScriptLoader.ShowSelection = function () {
    Show( this.selection );
    this.BlockInput( "selection", true );
}
ScriptLoader.HideSelection = function () {
    Hide( this.selection );
    this.BlockInput( "selection", false );
}
ScriptLoader.AppendSelection = function ( data ) {
    let {
        line,
        title
    } = this.ResolveLine( data );
    let choice = Create( "div", "choice disable-select" );
    choice.innerHTML = line || title;
    let that = this;
    choice.addEventListener( 'click', ( e ) => {
        if ( !that.config.version ) {
            let d = that.chapters[ that.pointer.chapter ];
            let flag = false;
            for ( let i = 0; i < d.length; i++ ) {
                if ( d[ i ].command === data.arg1 ) {
                    that.SetLine( i );
                    that.SeekLine( i );
                    flag = true;
                    break;
                }
            }
            if ( !flag ) {
                alert( "This choice leads to another chapter." );
            }
        } else {
            if ( typeof data.arg2 === 'function' ) {
                data.arg2.call( that.memory );
            }
        }
        that.ExitSelection();
        e.preventDefault();
        e.stopPropagation();
        return true;
    } );
    Append( choice, this.selection );

}
ScriptLoader.ExitSelection = function () {
    this.HideSelection();
    let data = this.chapters[ this.pointer.chapter ];
    let l = this.last.line;
    while ( data[ l ] && data[ l ].command === 'Selection' ) {
        l++;
    }
    this.SeekLine( l );
    this.SetLine( l );
    this.ImmediateUpdate();
}