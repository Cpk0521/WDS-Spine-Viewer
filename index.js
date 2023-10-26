import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.1/dist/tweakpane.min.js';
import * as EssentialsPlugin from 'https://cdn.jsdelivr.net/npm/@tweakpane/plugin-essentials@0.2.0/dist/tweakpane-plugin-essentials.min.js'
//pixi v7
function createApp(){
    const _app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x999999,
        antialias: true,
        hello: false,
        autoResize: window,
        resolution: window.devicePixelRatio || 1
    })
    
    document.getElementById('app').append(_app.view);

    globalThis.__PIXI_APP__ = _app;
    
    PIXI.Assets.setPreferences({
        preferCreateImageBitmap: false,
    });
    
    const _resize = (e) => {
        if(e === void 0) { e = null; }
        let _width =  document.getElementById('app').clientWidth;
        let _height =  document.getElementById('app').clientHeight;
        _app.renderer.resize(_width, _height);
    }
    
    _resize();
    window.addEventListener('resize', _resize);

    return _app;
}

//pixi v8
// async function createApp_v8(preference){
//     const _app = new Application();

//     await _app.init({
//         preference,
//         width: window.innerWidth,
//         height: window.innerHeight,
//         backgroundColor: 0x999999,
//         autoResize: true,
//         antialias: true,
//         hello: false,
//     })

//     globalThis.__PIXI_APP__ = _app;

//     document.getElementById('app').append(_app.canvas);

//     const _resize = (e) => {
//         if(e === void 0) { e = null; }
//         let _width =  document.getElementById('app').clientWidth;
//         let _height =  document.getElementById('app').clientHeight;
//         _app.renderer.resize(_width, _height);
//     }
    
//     _resize();
//     window.addEventListener('resize', _resize);
// }

var spine = void 0;
var paneGroup = void 0;

(async function(){
    const app = createApp();
    const pane = new Pane({
        title : 'Options'
    });
    pane.registerPlugin(EssentialsPlugin);

    const spinedata = await fetch('https://raw.githubusercontent.com/nan0521/WDS-Adv-Resource/main/SpineMasterlist.json').then((v)=>v.json())
    
    const list = pane.addBlade({
        view: 'list',
        label: 'Spine',
        options: spinedata.map(element => {
            return {
                text: element.Id.toString(),
                value: element.Id.toString(),
            }
        }),
        value: ''
    })

    pane.addButton({
        title: 'Create',
    }).on('click', ()=>{
        if(list.value){

            if(spine){
                app.stage.removeChild(spine);
                spine.destroy();
            }

            if(paneGroup){
                pane.remove(paneGroup)
            }

            loadSpine(list.value).then((_spine)=>{
                console.log(_spine)
                spine = _spine
                _spine.scale.set(0.25);
                _spine.x = app.screen.width/2;
                _spine.y = app.screen.height/2;
                app.stage.addChild(_spine);

                let params = {
                    scale: 0.25,
                    track : 0,
                    loop : true,
                    speed : 1,
                };
                
                spine.state.setAnimation(0, 'breath', params.loop);
                paneGroup = addModelSetting(pane, params);
                
                _spine.cursor = 'pointer'
                _spine.eventMode = 'static'
                let dragging = false

                _spine.on("pointerdown", (e) => {
                    dragging = true;
                    _spine._pointerX = e.data.global.x - _spine.x;
                    _spine._pointerY = e.data.global.y - _spine.y;
                });

                _spine.on("pointermove", (e) => {
                    if (dragging) {
                        _spine.position.x = e.data.global.x - _spine._pointerX;
                        _spine.position.y = e.data.global.y - _spine._pointerY;
                    }
                });
                
                _spine.on("pointerupoutside", () => (
                    dragging = false
                ));
                _spine.on("pointerup", () => (
                    dragging = false
                ));

            })

        }
    })

})()

async function loadSpine(uid){
    const resource = await PIXI.Assets.load(`https://raw.githubusercontent.com/nan0521/WDS-Adv-Resource/main/spine/${uid}.skel`);
    return new PIXI.spine.Spine(resource.spineData);
}

function addModelSetting(pane, config){
    const f1 = pane.addFolder({
        title: 'Model Setting',
    });
    
    f1.addBinding(config, 'speed', {
        label: 'Speed',
        min: 0,
        max: 3,
        step: 0.01,
    }).on('change', (ev)=>{
        spine.state.timeScale = ev.value;
    })

    f1.addBinding(config, 'scale', {
        label: 'Scale',
        min: 0,
        max: 10,
        step: 0.01,
    }).on('change', (ev) => {
        spine.scale.set(ev.value);
    })

    const trackslist = [0, 1, 2, 3, 4, 5]
    f1.addBinding(config, 'track', {
        view: 'radiogrid',
        groupName: 'track',
        size: [6, 1],
        cells: (x, y) => ({
            title: `${trackslist[y * 1 + x]}`,
            value: trackslist[y * 1 + x],
        }),
        label: 'Tracks',
    })

    f1.addBinding(config, 'loop', {
        label: 'Loop',
    }).on('change', (ev) => {
        spine.state.tracks.forEach(track => track.loop = ev.value);
    });

    f1.addBlade({
        view: 'list',
        label: 'Animations',
        options: spine.spineData.animations.map(anim => {
            return {
                text: anim.name.toString(),
                value: anim.name.toString(),
            }
        }),
        value: 'breath'
    }).on('change', (ev)=>{
        spine.state.setAnimation(config.track, ev.value, config.loop);
    })

    return f1
}