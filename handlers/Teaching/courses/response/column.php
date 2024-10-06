<?php

function Teaching_courses_response_column($params)
{
	$communityId = Users::communityId();
	$columnsStyle = Q_Config::get('Communities', 'layout', 'columns', 'style', 'classic');

	Q_Response::addScript('{{Teaching}}/js/columns/courses.js');
	Q_Response::addStylesheet('{{Teaching}}/css/columns/courses.css');

	$text = Q_Text::get('Teaching/content')['courses'];
	$url = Q_Uri::url(Q::ifset(Teaching::$options, 'courses', 'url', "Teaching/courses"));

	$title = $text['Title'];

	$column = Q::view('Teaching/column/courses.php', compact(
		'communityId','text'
	));
	Teaching::$columns['courses'] = array(
		'title' => $title,
		'column' => $column,
		'columnClass' => 'Communities_column_'.$columnsStyle,
		'close' => false,
		'url' => $url
	);

	$description = Q::interpolate($text['Description'], array($communityId));
	$keywords = $text['Keywords'];
	$image = Q_Html::img('img/icon/400.png');
	Q_Response::setCommonMetas(compact(
		'title', 'description', 'keywords', 'image', 'url'
	));
	return $column;
}

