<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_GET['url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'URL parameter is required']);
    exit;
}

$url = $_GET['url'];

// Fetch recipe page
$html = file_get_contents($url);
if ($html === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch recipe']);
    exit;
}

// Find recipe schema data
if (preg_match('/<script[^>]*class="yoast-schema-graph"[^>]*>(.*?)<\/script>/s', $html, $matches)) {
    $json = json_decode($matches[1], true);
    if ($json) {
        // Find recipe data in graph
        $recipe = null;
        foreach ($json['@graph'] as $item) {
            if ($item['@type'] === 'Recipe') {
                $recipe = $item;
                break;
            }
        }

        if ($recipe) {
            // Parse durations
            function parseDuration($duration) {
                if (!$duration) return null;
                if (preg_match('/PT(?:(\d+)H)?(?:(\d+)M)?/', $duration, $matches)) {
                    $hours = isset($matches[1]) ? intval($matches[1]) : 0;
                    $minutes = isset($matches[2]) ? intval($matches[2]) : 0;
                    return ($hours * 60) + $minutes;
                }
                return null;
            }

            // Format recipe data
            $data = [
                'title' => $recipe['name'] ?? '',
                'author' => $recipe['author']['name'] ?? '',
                'prep_time' => parseDuration($recipe['prepTime'] ?? ''),
                'cook_time' => parseDuration($recipe['cookTime'] ?? ''),
                'total_time' => parseDuration($recipe['totalTime'] ?? ''),
                'servings' => $recipe['recipeYield'][0] ?? '',
                'ingredients' => $recipe['recipeIngredient'] ?? [],
                'instructions' => array_map(function($step) {
                    return $step['text'];
                }, $recipe['recipeInstructions'] ?? []),
                'rating' => $recipe['aggregateRating']['ratingValue'] ?? null,
                'rating_count' => $recipe['aggregateRating']['ratingCount'] ?? null,
                'cuisine' => $recipe['recipeCuisine'][0] ?? '',
                'category' => $recipe['recipeCategory'][0] ?? '',
                'image' => $recipe['image'][0] ?? null
            ];

            echo json_encode($data);
            exit;
        }
    }
}

http_response_code(404);
echo json_encode(['error' => 'Recipe data not found']);
?>