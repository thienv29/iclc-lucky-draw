# Lucky Draw App

This is a web application for conducting lucky draws with various prizes. Users can trigger the lucky draw for different prize categories, and the results are displayed in an animated manner. The project includes HTML, CSS, and JavaScript files for the frontend, as well as a Node.js server for potential backend functionalities.

## Project Structure

### HTML Files

- `index.html`: The main HTML file that defines the structure of the lucky draw app. It includes references to CSS and JavaScript files.
  
### CSS Files

- `style.css`: Stylesheet for the main layout of the lucky draw app.
- `result-random.css`: Stylesheet for the animated result display.

### JavaScript Files

- `render.js`: Contains the logic for rendering random results, handling the bookGift function, and managing the animation of results.
- `main.js`: Implements additional features, such as exporting results to CSV, handling key events for controlling audio and gift display.

### Assets

- `media/`: Contains video and audio files used in the app.
- `icon/`: Icons for different prize categories.
- `ribbon/`: Images of ribbons corresponding to different prize categories.
- `lib/`: External libraries like Bootstrap and jQuery.

## Usage

1. Open `index.html` in a web browser.
2. Use the following key shortcuts for different functionalities:
   - Press `0` to toggle the background music.
   - Press `1` to trigger the lucky draw for the top prize.
   - Press `2` for the second prize.
   - Press `3` for the third prize.
   - Press `4` for encouragement prize.
   - Press `5` for lucky draw prize.
   - Press `6` to show all gift categories.
   - Press `7` to export the results to a CSV file.
   - Press `8` to play/pause the introduction video.
   - Press `9` to toggle the game play music.

## Additional Notes

- The project uses jQuery and Bootstrap for styling and functionality.
- The server-side functionalities are not implemented in the provided code and can be added if needed.

## Credits

This project was created by Vũ Quý Thiện (Thiendev) and is open source. Feel free to contribute or modify it according to your requirements.

## License

This project is licensed under the [MIT License](LICENSE).
