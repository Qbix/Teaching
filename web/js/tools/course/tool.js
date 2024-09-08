(function (Q, $, window, undefined) {

/**
 * Teaching/course tool.
 * Renders a course tool
 * @class Teaching/course
 * @constructor
 * @param {Object} [options] options to pass
 */
Q.Tool.define("Teaching/course", function(options) {
	var tool = this;
	var state = this.state;
	var $toolElement = $(tool.element);

	var pipe = new Q.pipe(["stream", "interests"], function () {
		$toolElement.on(Q.Pointer.fastclick, ".Teaching_course_conversation", function () {
			Q.invoke({
				title: tool.text.courses.Conversation,
				content: $("<div>").tool("Streams/chat", {
					publisherId: tool.stream.fields.publisherId,
					streamName: tool.stream.fields.name
				}),
				trigger: tool.element,
				onActivate: function () {

				}
			});
		});

		Q.handle(tool.refresh, tool, [tool.stream]);
	});
	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		if (err) {
			return;
		}

		tool.stream = this;
		pipe.fill("stream")();
	});
	Q.Streams.related.force(state.publisherId, state.streamName, "interest", true, function () {
		tool.interests = {};
		Q.each(this.relatedStreams, function () {
			tool.interests[Q.normalize(this.fields.title)] = {
				title: this.fields.title
			};
		});
		pipe.fill("interests")();
	});

	var _refreshOnLogin = function () {
		Q.Streams.get.force(state.publisherId, state.streamName, function (err) {
			if (err) {
				return;
			}

			tool.refresh(this);
		});
	};
	Q.Users.onLogin.set(_refreshOnLogin, this);
	Q.Users.onLogout.set(_refreshOnLogin, this);
	Q.Assets.Subscriptions.onSubscribe.set(_refreshOnLogin, this);
},

{
	publisherId: null,
	streamName: null
},

{
	refresh: function (stream) {
		var tool = this;
		var state = tool.state;
		var $toolElement = $(this.element);
		tool.stream = stream;

		stream.retain(tool);

		var fullAccess = stream.testReadLevel(40);

		$toolElement.attr("data-fullAccess", fullAccess);

		var content = fullAccess ? stream.fields.content : stream.getAttribute("teaser:Streams/description") || "";

		$toolElement.attr("data-emptyDesc", !content);

		stream.onFieldChanged("icon").set(function (modFields, field) {
			stream.refresh(function () {
				stream = this;
				$(".Teaching_course_image", tool.element).css("background-image", "url("+stream.iconUrl(state.imagepicker.showSize)+")");
			}, {
				messages: true,
				evenIfNotRetained: true
			});
		}, tool);

		if (fullAccess) {
			stream.onFieldChanged("content").set(function (modFields, field) {
				stream.refresh(function () {
					stream = this;
					var content = stream.fields.content || "";
					$toolElement.attr("data-emptyDesc", !content);
					Q.replace($(".Teaching_course_description", tool.element)[0], content.encodeHTML());
				}, {
					messages: true,
					evenIfNotRetained: true
				});
			}, tool);
		} else {
			stream.onAttribute("teaser:Streams/description").set(function (modFields, field) {
				stream.refresh(function () {
					stream = this;
					var content = stream.getAttribute("teaser:Streams/description") || "";
					$toolElement.attr("data-emptyDesc", !content);
					Q.replace($(".Teaching_course_description", tool.element)[0], content.encodeHTML());
				}, {
					messages: true,
					evenIfNotRetained: true
				});
			}, tool);
		}

		var byRole = Q.getObject(["byRole"], Q.Communities) || {};
		var isAdmin = byRole.hasOwnProperty("Users/owners") || byRole.hasOwnProperty("Users/admins");
		var fields = {
			src: stream.iconUrl(state.imagepicker.showSize),
			title: stream.fields.title,
			content: content.encodeHTML(),
			interests: tool.interests,
			isAdmin: isAdmin
		};

		Q.Template.render('Teaching/course/tool', fields, function (err, html) {
			if (err) return;

			Q.replace(tool.element, html);

			var teaserVideoUrl = tool.stream.getAttribute("teaser:Streams/video");
			if (teaserVideoUrl) {
				$("<div>").tool("Q/video", {
					url: teaserVideoUrl,
					autoplay: true
				}).appendTo($(".Teaching_course_image", tool.element).attr("data-video", true)).activate();
			}

			// get stream with all participants
			Q.Streams.get(state.publisherId, state.streamName, function (err, eventStream, extra) {
				var participants = Q.getObject(['participants'], extra);

				$(".participantsTool", $toolElement).tool('Streams/participants', {
					publisherId: stream.fields.publisherId,
					streamName: stream.fields.name,
					max: stream.getAttribute('peopleMax') || 10,
					maxShow: 10,
					showControls: true,
				}).activate(function () {
					var participantsTool = this;
					if (!participants) {
						return;
					}

					// ordering
					var participantsOrdering = [];
					Q.each(participants, function (userId, streamsParticipant) {
						if (!streamsParticipant) {
							return;
						}

						if (streamsParticipant.getExtra("role") === "Users/teachers" || streamsParticipant.getExtra("role") === "speaker") {
							participantsOrdering.push(userId);
						}
					});
					participantsTool.state.ordering = participantsOrdering;
					Q.handle(participantsTool.Q.onStateChanged("ordering"));
					participantsTool.state.onRefresh.add(function () {
						// add to participants onRefresh event handler to update avatar data-role
						Q.each(participants, function (index, participant) {
							if (participant.state !== 'participating') {
								return;
							}

							var extra = participant.extra ? JSON.parse(participant.extra) : null;

							if (participant.testRoles('Users/teachers')) {
								// logged user is a staff in this event
								if (Q.Users.loggedInUserId() === participant.userId) {
									$toolElement.attr("data-teacher", true);
								}

								Q.Teaching.Course.updateParticipants({
									tool: tool,
									userId: participant.userId,
									teacher: true
								});
							}
						});
					}, tool);
				});
			}, {
				participants: 100
			});

			$(".Teaching_course_topics", $toolElement).tool("Streams/related", {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				relationType: "Streams/topic",
				composerPosition: "last",
				relatedOptions: {
					ascending: true
				},
				creatable: {
					'Streams/topic': {title: tool.text.topic.NewTopic}
				}
			}).activate();

			var $teachingCourseSubscription = $(".Teaching_course_subscription", $toolElement);
			if (!$teachingCourseSubscription.length) {
				return;
			}
			$teachingCourseSubscription[0].forEachTool("Assets/plan/preview", function () {
				var assetsPlanPreview = this;
				var $assetsPlanPreviewElement = $(assetsPlanPreview.element);

				// in order to open column with Assets/plan onClick
				$assetsPlanPreviewElement.attr("data-onInvoke", "openTool");

				// set beforeClose to avoid close stream, but just unrelate
				var streamsPreview = Q.Tool.from(assetsPlanPreview.element, "Streams/preview");
				streamsPreview.state.beforeClose = function (_delete) {
					streamsPreview.element.addClass('Q_working');
					Q.Streams.unrelate(
						streamsPreview.state.publisherId,
						streamsPreview.state.streamName,
						Q.Assets.Subscriptions.plan.relationType,
						state.publisherId,
						state.streamName, function (err, result) {
							streamsPreview.element.removeClass('Q_working');
							if (err) {
								return Q.alert(err);
							}
							if (!result) {
								return Q.alert("Unrecognised error");
							}

							Q.Tool.remove(streamsPreview.element, true, true);
						}
					);
				};

				// set creatable.preprocess to add course to Assets/plan
				if ($assetsPlanPreviewElement.hasClass("Streams_related_composer")) {
					streamsPreview.state.creatable.preprocess = function (_proceed) {
						Q.Dialogs.push({
							title: tool.text.courses.SelectSubscriptionPlan,
							className: "Teaching_course_select_plan",
							content: $("<div>").tool("Streams/related", {
								publisherId: Q.Users.currentCommunityId,
								streamName: "Assets/plans",
								relationType: "Assets/plan",
								editable: false,
								closeable: false,
								realtime: true,
								sortable: false,
								relatedOptions: {
									withParticipant: false,
									ascending: true
								}
							}),
							onActivate: function (dialog) {
								dialog.forEachTool("Assets/plan/preview", function () {
									var streamsPreview = Q.Tool.from(this.element, "Streams/preview");
									this.state.onInvoke = function () {
										var relatedTool = Q.Tool.from($teachingCourseSubscription[0], "Streams/related");
										if (!relatedTool) {
											return Q.alert("Related tool not found!");
										}
										if (Q.getObject([streamsPreview.state.publisherId, streamsPreview.state.streamName], relatedTool.previewElements)) {
											return Q.alert("This plan already added");
										}
										streamsPreview.element.addClass("Q_working");
										Q.Streams.relate(
											streamsPreview.state.publisherId,
											streamsPreview.state.streamName,
											Q.Assets.Subscriptions.plan.relationType,
											state.publisherId,
											state.streamName,
											function () {
												streamsPreview.element.removeClass("Q_working");
												relatedTool.refresh();
											}
										);
									};
								});
							}
						});
						return false;
					};
				}
			}, tool);
			$teachingCourseSubscription.tool("Streams/related", {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				isCategory: false,
				editable: false,
				relationType: Q.Assets.Subscriptions.plan.relationType,
				composerPosition: "last",
				relatedOptions: {
					ascending: true
				},
				creatable: {
					'Assets/plan': {title: tool.text.courses.AssignToPlan}
				}
			}).activate();
		});
	}
});

Q.Template.set('Teaching/course/tool',
`<h1 class="Teaching_course_title">{{title}}</h1>
	<div class="Teaching_course_image" style="background-image: url({{src}})"></div>
	<div class="participantsTool"></div>
	<div class="Teaching_course_description">{{{content}}}</div>
	<div class="Teaching_course_conversation"><h2>{{courses.Conversation}}</h2></div>
	{{#if (call "Q.isEmpty" interests)}}
	{{else}}
		<div class="Teaching_course_interests">
			<h2>{{courses.Interests}}</h2>
			<ul>
			{{#each interests}}
				<li>{{this.title}}</li>
			{{/each}}
			</ul>
		</div>
	{{/if}}	
	<div class="Teaching_course_topics"></div>
	{{#if isAdmin}}
		<div class="Teaching_course_subscription"></div>
	{{/if}}`, {text: ['Teaching/content']}
);

})(Q, Q.jQuery, window);