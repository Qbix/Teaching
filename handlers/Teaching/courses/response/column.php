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

	$description = Q::text($text['Description'], array($communityId));
	Q_Response::setMeta(array(
		array('attrName' => 'name', 'attrValue' => 'title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'og:title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'twitter:title', 'content' => $title),
		array('attrName' => 'name', 'attrValue' => 'description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'og:description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'twitter:description', 'content' => $description),
		array('attrName' => 'name', 'attrValue' => 'keywords', 'content' => $text['Keywords']),
		array('attrName' => 'property', 'attrValue' => 'og:keywords', 'content' => $text['Keywords']),
		array('attrName' => 'property', 'attrValue' => 'twitter:keywords', 'content' => $text['Keywords']),
		array('attrName' => 'property', 'attrValue' => 'og:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:card', 'content' => 'summary')
	));

	return $column;
}

