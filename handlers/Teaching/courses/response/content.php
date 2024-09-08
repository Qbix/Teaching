<?php

function Teaching_courses_response_content($params)
{
	Q::event('Teaching/courses/response/column', $params);
	return Q::view('Teaching/content/columns.php');
}