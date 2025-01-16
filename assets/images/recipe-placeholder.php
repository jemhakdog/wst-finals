<?php
header('Content-Type: image/jpeg');

// Create image
$width = 800;
$height = 600;
$image = imagecreatetruecolor($width, $height);

// Colors
$bg_color = imagecolorallocate($image, 240, 240, 240);
$text_color = imagecolorallocate($image, 150, 150, 150);
$border_color = imagecolorallocate($image, 200, 200, 200);

// Fill background
imagefill($image, 0, 0, $bg_color);

// Draw border
imagerectangle($image, 0, 0, $width-1, $height-1, $border_color);

// Add text
$text = "Recipe Image";
$font = 5; // Built-in font
$text_width = imagefontwidth($font) * strlen($text);
$text_height = imagefontheight($font);
$x = ($width - $text_width) / 2;
$y = ($height - $text_height) / 2;
imagestring($image, $font, $x, $y, $text, $text_color);

// Output image
imagejpeg($image);
imagedestroy($image);
?>