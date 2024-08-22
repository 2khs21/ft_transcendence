
import * as THREE from 'three';
// import WebGL from 'three/addons/capabilities/WebGL.js';
// import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js';
// import { FontLoader } from 'three/examples/jsm/Addons.js';
// import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
// import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import { depth } from 'three/examples/jsm/nodes/Nodes.js';
import WebGL from 'WebGL';
import { RoundedBoxGeometry } from 'RoundedBoxGeometry';
import { GUI } from 'GUI';
import { FontLoader } from 'FontLoader';
import { TextGeometry } from 'TextGeometry';

import { authState } from "./app.js";

// official board size
const boardWidth = 300;
const boardHeight = 400;
const winScore = 5;
const gameTime = 300;
const ballSpeed = 1.0;
const ballRadius = 10;
const paddleSpeed = 1.0;
const udpPort = 9981;

export function renderGame() {
    init();
}
export function removeGame() {
    const app = document.getElementById('app');
    while (app.firstChild) {
        app.removeChild(app.firstChild);
    }
}

function restartGame() {
    removeGame();
    init();
}

const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";

let gameSocket = new WebSocket(
    // TODO : ws to wss
    `${protocol}${window.location.hostname}/ws/game/`
);

var username = localStorage.getItem("username");


// ------------- Django - Browser communication main logic -------------
gameSocket.onmessage = function (event) {
    console.log("getting message from server");
};
// ---------------------------------------------------------------------

gameSocket.onopen = function (event) {
    console.log("Connected to Websocket Game Server");
};

gameSocket.onclose = function () {
    console.log("Game Websocket closed, Disconnected from Game Server");
};

gameSocket.onerror = function (error) {
    if (authState.isLoggedIn == true) {
        console.error("Game socket closed unexpectedly reason : " + error);
        setTimeout(() => restartGame(), 5000);
    } else {
        console.log("WebSocket connection closed during logout.");
    }
};

// django server와 통신하기 위한 query_id
function createGameSession(roomName) {
    const message = {
        type: create_game_session,
        room_name: roomName
    };
    gameSocket.send(JSON.stringify(message));
}

function startGameRound(roomNmae) {
    const message = {
        type: start_game_round,
        room_name: roomName
    };
    gameSocket.send(JSON.stringify(message));
}

function matchDual() {
    const message = {
        type: match_dual,
    };
    gameSocket.send(JSON.stringify(message));
}

function matchTournament() {
    const message = {
        type: match_tournament,
    };
    gameSocket.send(JSON.stringify(message));
}


/* --------------------- THREE.js game logic starts --------------------- */


// 씬 만들기
export function init() {
    
    if (WebGL.isWebGLAvailable()) {
        gameSocket = new WebSocket(
            // TODO : ws to wss
            `${protocol}${window.location.hostname}/ws/game/`
        );
        gameSocket.binaryType = 'arraybuffer';
        
        const scene = new THREE.Scene();
        const gui = new GUI();
        //textGeometry를 담을 배열
        
        // for raycasting
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let SELECTED;
        
        let raycastArray = new Array(2);
        let scoreArray = new Array();
        // let raycastMesh, raycastLine;
        

        // 카메라 만들기 (FoV, aspect ratio, near clipping plane, far clipping plane );
        // window.innerWidth / window.innerHeight 은 화면의 비율 (aspect ratio)
        // near clipping plane 아래와 far clipping plane 밖은 렌더되지 않음.
        const camera = new THREE.PerspectiveCamera(90, (window.innerWidth / 1.5) / (window.innerHeight / 1.5), 0.1, 5000);
        camera.position.set(0, -250, 150);
        // camera.position.set(0, -50, 100);
        camera.lookAt(0, 70, -50);
        camera.aspect = (window.innerWidth / 1.5) / (window.innerHeight / 1.5);

        // 렌더러 만들기, 브라우저 윈도우만큼 사이즈를 지정해 주었는데 다른 경우도 가능할 듯?
        // window.innerWidth/2 and window.innerHeight/2 라고 한다.
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        // 세 번째 인자로 false를 주면 더 작은 레솔루션으로 렌더 가능 (최적화?)
        renderer.setSize(window.innerWidth / 1.5, window.innerHeight / 1.5);
        // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setPixelRatio(window.devicePixelRatio, 2);

        // main loop 인 듯? 몰루?
        renderer.setAnimationLoop(animate);

        // 그림자 on
        renderer.shadowMap.enabled = true;

        if (document.getElementById('app').children.length == 0) {
            document.getElementById('app').appendChild(renderer.domElement);
            document.getElementById('app').children[0].id = 'pong';
        }
        let container = document.getElementById( 'pong' );

        const ambientLightColor = 0x404040;
        const ambientLightIntensity = 10;
        const ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity);
        scene.add(ambientLight);

        const directionalLightColor = 0xFFFFFF;
        const directionalLightIntensity = 20;
        const directionalLight = new THREE.DirectionalLight(directionalLightColor, directionalLightIntensity);
        directionalLight.position.set(0, -200, 200);
        directionalLight.target.position.set(0, -boardHeight / 2, 0);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        scene.add(directionalLight.target);

        const pointLightColor = 0xFFFFFF;
        const pointLightIntensity = 100000;
        const pointLight = new THREE.PointLight(pointLightColor, pointLightIntensity, 0, 2);
        pointLight.position.set(0, 0, 100);
        pointLight.castShadow = true;
        scene.add(pointLight);

        // const spotLightColor = 0xFFFFFF;
        // const spotLightIntensity = 100000;
        // const spotLight = new THREE.SpotLight(spotLightColor, spotLightIntensity);
        // spotLight.position.set(0, 0, 200);
        // spotLight.castShadow = true;
        // spotLight.shadow.mapSize.width = 256;
        // spotLight.shadow.mapSize.height = 256;
        // spotLight.shadow.camera.near = 0;
        // spotLight.shadow.camera.far = 4000;
        // spotLight.shadow.camera.fov = 30;


        const vertexShader = `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `;

        const fragmentShader = `
    //   // Created by inigo quilez - iq/2013 : https://www.shadertoy.com/view/4dl3zn
    //   // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    //   // Messed up by Weyland
      
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      
    //   void main() {
    //     vec2 uv = -1.0 + 2.0 * gl_FragCoord.xy / iResolution.xy;
    //     uv.x *= iResolution.x / iResolution.y;
    //     vec3 color = vec3(0.0);
        
    //     for (int i = 0; i < 128; i++) {
    //         float pha = sin(float(i) * 546.13 + 1.0) * 0.5 + 0.5;
    //         float siz = pow(sin(float(i) * 651.74 + 5.0) * 0.5 + 0.5, 4.0);
    //         float pox = sin(float(i) * 321.55 + 4.1) * iResolution.x / iResolution.y;
    //         float rad = 0.1 + 0.5 * siz + sin(pha + siz) / 4.0;
    //         vec2 pos = vec2(pox + sin(iTime / 15. + pha + siz), -1.0 - rad + (2.0 + 2.0 * rad) * mod(pha + 0.3 * (iTime / 7.) * (0.2 + 0.8 * siz), 1.0));
    //         float dis = length(uv - pos);
    //         vec3 col = mix(vec3(0.194 * sin(iTime / 6.0) + 0.3, 0.2, 0.3 * pha), vec3(1.1 * sin(iTime / 9.0) + 0.3, 0.2 * pha, 0.4), 0.5 + 0.5 * sin(float(i)));
    //         float f = length(uv - pos) / rad;
    //         f = sqrt(clamp(1.0 + (sin((iTime) * siz) * 0.5) * f, 0.0, 1.0));
    //         color += col.zyx * (1.0 - smoothstep(rad * 0.15, rad, dis));
    //     }
    //     color *= sqrt(1.5 - 0.5 * length(uv));
    //     gl_FragColor = vec4(color, 1.0);
    //   }

    // Created by Deadtotem in 2020-08-13 shadertoy.com
    // https://www.shadertoy.com/view/tllfRX
#define NUM_LAYERS 4.
#define TAU 6.28318
#define PI 3.141592
#define Velocity .025 //modified value to increse or decrease speed, negative value travel backwards
#define StarGlow 0.025
#define StarSize 01.
#define CanvasView 20.


float Star(vec2 uv, float flare){
    float d = length(uv);
  	float m = sin(StarGlow*1.2)/d;  
    float rays = max(0., .5-abs(uv.x*uv.y*1000.)); 
    m += (rays*flare)*2.;
    m *= smoothstep(1., .1, d);
    return m;
}

float Hash21(vec2 p){
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p+45.32);
    return fract(p.x*p.y);
}

vec3 StarLayer(vec2 uv){
    vec3 col = vec3(0);
    vec2 gv = fract(uv);
    vec2 id = floor(uv);
    for(int y=-1;y<=1;y++){
        for(int x=-1; x<=1; x++){
            vec2 offs = vec2(x,y);
            float n = Hash21(id+offs);
            float size = fract(n);
            float star = Star(gv-offs-vec2(n, fract(n*34.))+.5, smoothstep(.1,.9,size)*.46);
            vec3 color = sin(vec3(.2,.3,.9)*fract(n*2345.2)*TAU)*.25+.75;
            color = color*vec3(.9,.59,.9+size);
            star *= sin(iTime*.6+n*TAU)*.5+.5;
            col += star*size*color;
        }
    }
    return col;
}

void main()
{
    //  vec2 uv = (gl_FragCoord-.5*iResolution.xy)/iResolution.y;
    vec2 uv = -1.0 + 2.0 * gl_FragCoord.xy / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;
	vec2 M = vec2(0);
    M -= vec2(M.x+sin(iTime*0.22), M.y-cos(iTime*0.22));
    M +=(iMouse.xy-iResolution.xy*.5)/iResolution.y;
    float t = iTime*Velocity; 
    vec3 col = vec3(0);  
    for(float i=0.; i<1.; i+=1./NUM_LAYERS){
        float depth = fract(i+t);
        float scale = mix(CanvasView, .5, depth);
        float fade = depth*smoothstep(1.,.9,depth);
        col += StarLayer(uv*scale+i*453.2-iTime*.05+M)*fade;}   
    gl_FragColor = vec4(col,1.0);
}
      `;

        const backgroundShader = new THREE.ShaderMaterial({
            uniforms: {
                iTime: {
                    type: 'f',
                    value: 0.0,
                },
                iResolution: {
                    type: THREE.Vector2,
                    value: [window.innerWidth / 1.5, window.innerHeight / 1.5],
                },
                iMouse: {
                    type: THREE.Vector2,
                    value: [0.0, 0.0],
                }
            },
            vertexShader,
            fragmentShader,
            side: THREE.BackSide,
        });
        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        // const skyMat = new THREE.ShaderMaterial({
        //     uniforms: uniforms,
        //     vertexShader: vertexShader,
        //     fragmentShader: fragmentShader,
        //     side: THREE.BackSide
        // });

        const sky = new THREE.Mesh(skyGeo, backgroundShader);
        scene.add(sky);

        // scene.overrideMaterial = backgroundShader;

        const boardGeometry = new THREE.BoxGeometry(boardWidth, boardHeight + 20, 100);
        // const planeMaterial = backgroundShader;
        const boardMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xB38FF0,
            side: THREE.FrontSide,
            transparent: false,
            opacity: 1,
            transmission: 0.3,
            thickness: 0.3,
            // reflectivity: 0.4,
            metalness: 1,
            roughness: 0.15,
            flatShading: true,
        });

        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.position.set(0, 0, -50);
        board.receiveShadow = true;
        scene.add(board);
        // board.scale.setX = 828;
        // board.scale.setY = 525;

        // 2.5 0.2 0.5
        const playerPaddleSizeX = boardWidth / 8;
        const playerPaddleSizeY = 5;
        const playerPaddleSizeZ = 10;

        const enemyPaddleGeometry = new RoundedBoxGeometry(playerPaddleSizeX, playerPaddleSizeY, playerPaddleSizeZ, 20, 20);
        // 컬러를 칠해 줄 메테리얼이 필요
        const enemyPaddleMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFE1E50,
            transparent: true,
            opacity: 0.9,
            transmission: 0.5,
            thickness: 1,
            reflectivity: 1.0,
            metalness: 1.0,
            roughness: 0.00,
        });

        // Mesh가 필요
        const enemyPaddle = new THREE.Mesh(enemyPaddleGeometry, enemyPaddleMaterial);
        enemyPaddle.castShadow = true;
        enemyPaddle.position.set(0, boardHeight / 2, playerPaddleSizeZ / 2);

        const myPaddleGeometry = new RoundedBoxGeometry(playerPaddleSizeX, playerPaddleSizeY, playerPaddleSizeZ, 20, 20);
        const myPaddleMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x90E0EF,
            transparent: true,
            opacity: 0.9,
            transmission: 0.5,
            thickness: 1,
            reflectivity: 1.0,
            metalness: 1.0,
            roughness: 0.00,

        });

        const myPaddle = new THREE.Mesh(myPaddleGeometry, myPaddleMaterial);
        myPaddle.position.set(0, -boardHeight / 2, playerPaddleSizeZ / 2);
        myPaddle.castShadow = true;

        // 0, 0, 0에 add됨
        scene.add(myPaddle);
        scene.add(enemyPaddle);

        // board 상하좌우 bars
        const verticalBarGeometry = new RoundedBoxGeometry(25, boardHeight + 20, 100, 20, 20);
        const barMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xB38FF0,
            transparent: true,
            opacity: 1.0,
            transmission: 0.5,
            thickness: 1,
            reflectivity: 0.5,
            metalness: 1.0,
            roughness: 0.1,
        });
        // const horizontalBarGeometry = new RoundedBoxGeometry(boardWidth / 4 - 10, 10, playerPaddleSizeZ, 20, 20);
        const westBar = new THREE.Mesh(verticalBarGeometry, barMaterial);
        const eastBar = new THREE.Mesh(verticalBarGeometry, barMaterial);
        // const leftNorthBar = new THREE.Mesh(horizontalBarGeometry, barMaterial);
        // const rightNorthBar = new THREE.Mesh(horizontalBarGeometry, barMaterial);
        // const leftSouthBar = new THREE.Mesh(horizontalBarGeometry, barMaterial);
        // const rightSouthBar = new THREE.Mesh(horizontalBarGeometry, barMaterial);


        westBar.position.set(-boardWidth / 2 - 12.5, 0, -40);
        eastBar.position.set(boardWidth / 2 + 12.5, 0, -40);
        // // (boardWidth / 2) - (boardWidth / 4 - 10) == boardWidth / 4 - 10;
        // leftNorthBar.position.set(-(boardWidth / 4 + 55), boardHeight / 2 + playerPaddleSizeY / 2, playerPaddleSizeZ);
        // rightNorthBar.position.set(boardWidth / 4 + 55, boardHeight / 2 + playerPaddleSizeY / 2, playerPaddleSizeZ);
        // leftSouthBar.position.set(-(boardWidth/ 4 + 55), -boardHeight / 2 - playerPaddleSizeY, playerPaddleSizeZ);
        // rightSouthBar.position.set(boardWidth / 4 + 55, -boardHeight / 2 - playerPaddleSizeY, playerPaddleSizeZ);

        scene.add(westBar);
        scene.add(eastBar);
        // scene.add(leftNorthBar);
        // scene.add(rightNorthBar);
        // scene.add(leftSouthBar);
        // scene.add(rightSouthBar);

        const ballGeometry = new THREE.SphereGeometry(ballRadius);
        const ballMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xB38FF0,
            transparent: true,
            opacity: 1.0,
            transmission: 0.5,
            thickness: 1,
            reflectivity: 1.0,
            metalness: 1.0,
            roughness: 0.1,
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.castShadow = true;
        ball.position.set(0, 0, ballRadius / 2);
        scene.add(ball);
        // spotLight.target = ball;
        // scene.add( spotLight );

        //Text 생성
        const createText = (message, size, position, rotation, scene, color = 0xB38FF0) => {
            const fontLoader = new FontLoader();

            async function loadFont() {
                const url = './PyeongChangPeaceBold_Regular.json'; //사용할 폰트 json 파일 위치(예제는 이순신 돋움)

                //폰트를 load 후 처리하도록 async await 사용
                const font = await new Promise((resolve, reject) => {
                    fontLoader.load(url, resolve, undefined, reject);
                });

                const revMessage = message.split("").reverse().join("  ");

                console.log(revMessage);

                const geometry = new TextGeometry(revMessage, {
                    font: font,
                    size: size,
                    depth: 5,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 1,
                    bevelSize: 0.5,
                    bevelSegments: 3,
                });

                //글자 채울 Material 설정
                const fillMaterial = new THREE.MeshPhongMaterial({ color });
                // const scoreMaterial = new THREE.MeshPhysicalMaterial({
                //     color: 0xFFFFFF,
                //     transparent: false,
                //     opacity: 1.0,
                //     transmission: 0.5,
                //     thickness: 1,
                //     reflectivity: 1.0,
                //     metalness: 0.0,
                //     roughness: 0.5,
                // });
                const text = new THREE.Mesh(geometry, fillMaterial);

                text.position.set(position.x, position.y, position.z);
                text.rotation.set(rotation.x, rotation.y, rotation.z);

                if (message === "듀얼") {
                    raycastArray[0] = text;
                }
                else if (message === "토너먼트") {
                    raycastArray[1] = text;
                } 
                // 메시지가 숫자일 경우
                else if (!isNaN(message)) {
                    scoreArray.push(text);
                }


                scene.add(text);

            }

            loadFont();
        }

        const textRotation = new THREE.Vector3(Math.PI / 2, 0, 0);

        const addScores = (player1Score, player2Score) => {

            //플레이어1, 플레이어2 점수 위치

            const player1ScorePosition = new THREE.Vector3(-boardWidth / 2 - 50, 200, 100);
            const player2ScorePosition = new THREE.Vector3(boardWidth / 2 - 0, 200, 100);

            // uses radians

            const scoreStr1 = player1Score.toString();
            const scoreStr2 = player2Score.toString();

            createText(scoreStr1, 50, player1ScorePosition, textRotation, scene, 0xFF8FF0);
            createText(scoreStr2, 50, player2ScorePosition, textRotation, scene, 0xB38FFF);

        }

        addScores(0, 0);

        // 흠......
        createText("듀얼", 20, new THREE.Vector3(-80, -100, 100), textRotation, scene, 0xB38FF0);
        createText("토너먼트", 20, new THREE.Vector3(100, -100, 100), textRotation, scene, 0xB38FF0);


        // gui용
        const options = {
            BallPositionX: 0,
            BallPositionY: 0,

            // boardWidth: 828,
            // boardHeight: 525,
        };

        gui.add(options, "BallPositionX", -boardWidth / 2, boardWidth / 2, 1).onChange((val) => {
            ball.position.setX(val);
        });
        gui.add(options, "BallPositionY", -boardHeight / 2, boardHeight / 2, 1).onChange((val) => {
            ball.position.setY(val);
        });


        window.addEventListener('resize', onWindowResize);
        container.addEventListener( 'mousemove', onDocumentMouseMove, false );
        container.addEventListener( 'mousedown', onDocumentMouseDown, false );
        container.addEventListener( 'resize', onWindowResize, false );

        function animate() {

            backgroundShader.uniforms.iTime.value += 0.0125;
            // find intersections

            raycaster.setFromCamera(pointer, camera);

            let intersects = raycaster.intersectObjects(scene.children);

            if (intersects.length > 0) {
                if (SELECTED != intersects[0].object) {

                    // 듀얼, 토너먼트 클릭 시 동작
                    if (SELECTED && SELECTED.material.emissive) {
                        SELECTED.material.emissive.setHex( SELECTED.currentHex );
                    }

                    SELECTED = intersects[0].object;
                    if (SELECTED && SELECTED.material.emissive && (SELECTED == raycastArray[0] || SELECTED == raycastArray[1])) {
                        SELECTED.currentHex = SELECTED.material.emissive.getHex();
                        SELECTED.material.emissive.setHex(0xff0000);
                    }
                    container.style.cursor = 'pointer';

                }
            }
            else {
                if (SELECTED) {
                    if (SELECTED.material.emissive)
                        SELECTED.material.emissive.setHex(SELECTED.currentHex);
                    SELECTED = null;
                    container.style.cursor = 'auto';
                }
            }


            renderer.render(scene, camera);
        }

        function onWindowResize() {

            camera.aspect = (window.innerWidth / 1.5) / (window.innerHeight / 1.5);
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth / 1.5, window.innerHeight / 1.5);

        }

        document.onkeydown = function (e) {
            handleKeyInput(e.key, 1);
        }

        document.onkeyup = function (e) {
            handleKeyInput(e.key, 2);
        }

        function handleKeyInput(key, inputType) {
            const queryID = 301;
            const sessionID = 1;  // This should be the actual session ID
            const playerID = 1;   // 1 for Player A, 2 for Player B
            let inputKey;

            switch (key) {
                case "ArrowLeft":
                    inputKey = 1;
                    break;
                case "ArrowRight":
                    inputKey = 2;
                    break;
                default:
                    inputKey = 0;
            }

            const message = {
                query_id: queryID,
                session_id: sessionID,
                player_id: playerID,
                input_key: inputKey,
                input_type: inputType
            };
            if (gameSocket.readyState === WebSocket.OPEN)
                gameSocket.send(JSON.stringify(message));
        }

        function onDocumentMouseMove( event ) {

            event.preventDefault();
    
            let gapX = event.clientX - event.offsetX;
            let gapY = event.clientY - event.offsetY;
            
            pointer.x = ((event.clientX - gapX)/( container.clientWidth )) * 2 - 1;
            pointer.y = -((event.clientY - gapY)/( container.clientHeight )) * 2 + 1;
    
        }

        // 듀얼과 토너먼트 클릭 시 이벤트
        function onDocumentMouseDown( event ) {

            event.preventDefault();
            if ( SELECTED && SELECTED.material.emissive && SELECTED == raycastArray[0]) {
                console.log("clicked Dual");
                scene.remove(raycastArray[0]);
                scene.remove(raycastArray[1]);

                createText("매칭!", 20, new THREE.Vector3(20, -100, 100), textRotation, scene, 0xB38FF0);

                matchDual();

            } else if ( SELECTED && SELECTED.material.emissive && SELECTED == raycastArray[1]) {
                console.log("clicked Tournament");
                scene.remove(raycastArray[0]);
                scene.remove(raycastArray[1]);

                createText("매칭!", 20, new THREE.Vector3(20, -100, 100), textRotation, scene, 0xB38FF0);

                matchTournament();
            }
    
        }

    } else {

        const warning = WebGL.getWebGLErrorMessage();
        document.getElementById('app').appendChild(warning);

    }
}






