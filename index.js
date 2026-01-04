const images = [
    "url('images/duck.jpeg')",
    "url('images/lexicon.jpeg')", 
    "url('images/peak.jpeg')", 
    "url('images/queen.jpeg')", 
    "url('images/satanic.jpeg')", 
    "url('images/wolf.jpeg')"
];

const tiles = document.querySelectorAll(".tile");
const scoreDisplay = document.getElementById("score");
const resetButton = document.getElementById("reset");
let score = 0;

document.getElementById("start").addEventListener("click", function() {
    this.style.display = "none";
    // Duplicate images so each has exactly 1 match
    let pairedImages = [...images, ...images];// 6 images in each array
    // Shuffle the images
    pairedImages = pairedImages.sort(() => Math.random() - 0.5);
    
    let flippedTiles = []; // Trqack flipped tiles
    // assigne images to tiles
    tiles.forEach((tile, index) => {
        let tileBack = tile.querySelector(".tile-back");
        tileBack.style.backgroundImage = pairedImages[index]; // Assign paired images
        tile.setAttribute("data-image", pairedImages[index]); 

        tile.addEventListener("click", function() {
            if (flippedTiles.length < 2) {
                this.classList.add("flipped"); // Flips the tile
                flippedTiles.push(this); // Add to flipped tiles
            }

            if (flippedTiles.length === 2){
                // check if match
                let [tile1, tile2] = flippedTiles;
                if (tile1.getAttribute("data-image") === tile2.getAttribute("data-image")) {
                    // Match
                    score++;
                    scoreDisplay.textContent = `Score: ${score}`;
                    flippedTiles = [];

                    //check if all the tiles are flipped 
                    if (document.querySelectorAll(".flipped").length === tiles.length) {
                        setTimeout(() => {
                            alert("You win!"); // notify upon win
                            resetButton.style.display = "block"; // reset tiles
                        }, 1000); // wait a second to flip last tile before appearing
                    };
                    
                } else {
                    // No match
                    setTimeout(() => {
                        tile1.classList.remove("flipped");
                        tile2.classList.remove("flipped");
                        flippedTiles = [];
                    }, 1000); // three second delay before flipping
                }
            } 
        });
    });
});
