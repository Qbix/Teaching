<div class="Teaching_courses_column">
    <?php echo Q::tool("Streams/related", array(
        "publisherId" => $communityId,
        "streamName" => "Teaching/courses/main",
        "relationType" => "Teaching/course",
        "realTime" => false,
        "sortable" => true,
		"composerPosition" => "last",
		"creatable" => array(
			"Teaching/course" => array(
				"title" => "New course"
			)
		)
    )) ?>
</div>