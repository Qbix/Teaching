/**
 * Teaching plugin's front end code
 *
 * @module Teaching
 * @class Teaching
 */
"use strict";
/* jshint -W014 */
(function(Q, $) {
	Q.Text.addFor(
		['Q.Tool.define', 'Q.Template.set'],
		'Teaching/', ["Teaching/content"]
	);
	Q.Tool.define({
		"Teaching/course": {
			js: [
				"{{Q}}/pickadate/picker.js",
				"{{Q}}/pickadate/picker.date.js",
				"{{Teaching}}/js/tools/course/tool.js"
			],
			css: [
				"{{Teaching}}/css/tools/course.css",
				"{{Q}}/pickadate/themes/default.css",
				"{{Q}}/pickadate/themes/default.date.css"
			],
			text: ["Teaching/content", "Streams/content"]
		},
		"Teaching/course/preview": {
			js: "{{Teaching}}/js/tools/course/preview.js",
			css: "{{Teaching}}/css/tools/previewCourse.css"
		}
	});
	["Teaching/course", "Teaching/course/preview"].forEach(function (toolName) {
		Q.Tool.define.options(toolName, {
			imagepicker: {
				showSize: "1000x",
				fullSize: "1000x",
				saveSizeName: {
					"1000x": '1000x.png'
				},
				save: "Teaching/course"
			}
		});
	});

	var Teaching = Q.Teaching = Q.plugins.Teaching = {

	};

	Teaching.Course = {
		/**
		 * Find Streams/participants tool inside tool and update avatars with badges
		 * @method updateParticipants
		 * @static
		 * @param {object} params
		 * @param {object} params.tool Tool parent for participants tool
		 * @param {String} params.userId
		 * @param {object} params.checkin [optional] If defined - set/unset checkin badge
		 */
		updateParticipants: function(params){
			params = params || {};
			var userId = params.userId
			if (!userId) {
				return console.warn('userId undefined');
			}

			var tool = params.tool;
			if (!tool) {
				return console.warn('parent tool undefined');
			}

			var participantsTool = Q.Tool.from($(".Streams_participants_tool", tool.element));

			if (!participantsTool) {
				return console.warn('participants tool not found');
			}

			var avatars = participantsTool.children("Users/avatar");

			Q.each(avatars, function(index, avatarTool){
				var avatarUserId = avatarTool.state.userId;

				// if avatar tool is empty - exit
				if(Q.isEmpty(avatarUserId) || avatarUserId !== userId){
					return;
				}

				// checkin action
				var checkin = params.checkin;
				if (typeof checkin !== 'undefined') {
					$(avatarTool.element).attr({"data-checkin": checkin});
				}

				// teacher action
				var teacher = params.teacher;
				if (typeof teacher !== 'undefined') {
					$(avatarTool.element).attr({"data-teacher": true}).tool('Q/badge', {
						tr: {
							size: "20px",
							top: "0",
							right: "0",
							className: "Teaching_course_teacher",
							display: 'block',
							content: '<img src="' + Q.url("{{Teaching}}/img/icons/labels/Teaching/teachers/40.png") + '" />'
						},
						skipOverlapped: true
					}).activate();
				}
			});
		}
	};

	var columnsOptions = {
		scrollbarsAutoHide: false,
		handlers: {
			courses: "{{Teaching}}/js/columns/courses.js",
			course: "{{Teaching}}/js/columns/course.js",
			topic: "{{Teaching}}/js/columns/topic.js"
		}
	};
	Q.Tool.define.options('Q/columns', columnsOptions);

	var selection = ".Teaching_course_preview_tool .Users_avatar_tool," + ".Teaching_course_tool .Users_avatar_tool";
	$('body').on(Q.Pointer.fastclick, selection, function (e) {
		var avatarTool = this.Q('Users/avatar');
		if (!avatarTool) {
			return;
		}

		var userId = avatarTool.state.userId;
		if (!userId) {
			return;
		}

		if (Q.Users.isCommunityId(userId)) {
			Q.Communities.openCommunityProfile.call(this, userId);
		} else {
			Q.Communities.openUserProfile.call(this, userId);
		}

		return false;
	});

	Q.page('', function () {

	}, 'Teaching');
})(Q, Q.jQuery);
