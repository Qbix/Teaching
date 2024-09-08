<?php

function Teaching_0_1_2_local()
{
	// symlink the icons folder
	Q_Utils::symlink(
		TEACHING_PLUGIN_FILES_DIR.DS.'Teaching'.DS.'icons',
		TEACHING_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Teaching_0_1_2_local();
