(function (Q, $, window, undefined) {

/**
 * Teaching/course/preview tool.
 * Renders a tool to preview courses
 * @class Teaching/course/preview
 * @constructor
 * @param {Object} [options] options to pass besides the ones to Teaching/preview tool
 */
Q.Tool.define("Teaching/course/preview", ["Streams/preview"], function(options, preview) {
	var tool = this;
	var $toolElement = $(tool.element);
	var state = this.state;
	tool.preview = preview;

	preview.state.imagepicker = Q.extend(preview.state.imagepicker, 10, state.imagepicker);
	preview.state.onRefresh.add(tool.refresh.bind(tool));
	preview.state.creatable.preprocess = tool.composer.bind(tool);
	preview.state.beforeClose = function (_delete) {
		Q.confirm(tool.text.courses.AreYouSureDeleteCourse, function (result) {
			if (result){
				_delete();
			}
		});
	};

	if (preview.state.streamName) {
		$toolElement.on(Q.Pointer.fastclick, function () {
			Q.handle(state.onInvoke, tool, [tool.stream]);
		});
	}
},

{
	onInvoke: new Q.Event(function (stream) {
		Q.invoke({
			title: stream.fields.title,
			name: "course",
			url: Q.url('course/' + stream.fields.publisherId + '/' + stream.fields.name.split('/').pop()),
			columnClass: 'Teaching_column_course',
			trigger: this.element,
			onError: {"Teaching/course/preview": function (err) {
				Q.alert(err);
			}},
			onActivate: function () {

			}
		});
	})
},

{
	refresh: function (stream) {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);
		var previewState = tool.preview.state;
		tool.stream = stream;

		stream.retain(tool);

		stream.onFieldChanged("icon").set(function (modFields, field) {
			stream.refresh(function () {
				stream = this;
				$(".Teaching_course_preview_background", tool.element).css("background-image", "url("+stream.iconUrl(state.imagepicker.showSize)+")");
			}, {
				messages: true,
				evenIfNotRetained: true
			});
		}, tool);
		$toolElement.attr("data-hideTitle", stream.getAttribute("hideTitle"));

		if (previewState.editable && stream.testWriteLevel('edit')) {
			previewState.actions.actions = previewState.actions.actions || {};
			previewState.actions.actions.edit = function () {
				tool.update(function () {
					stream.refresh(function () {
						stream = this;
					}, {
						messages: true,
						evenIfNotRetained: true
					});
				});
			};
		}

		var fields = {
			src: stream.iconUrl(state.imagepicker.showSize),
			title: stream.fields.title,
			content: stream.fields.content
		};
		Q.Template.render('Teaching/course/preview', fields, function (err, html) {
			if (err) return;

			Q.replace(tool.element, html);

			$(".Teaching_course_preview_title", tool.element).tool("Streams/inplace", {
				editable: false,
				field: "title",
				inplaceType: "text",
				publisherId: previewState.publisherId,
				streamName: previewState.streamName,
			})
			.activate(function () {
				this.$(".Q_inplace_tool_static").plugin("Q/textfill", {
					fillParent: true
				});
			});

			// get stream with all participants
			Q.Streams.get(previewState.publisherId, previewState.streamName, function (err, stream, extra) {
				var participants = Q.getObject(['participants'], extra);

				Q.Streams.related.force(previewState.publisherId, previewState.streamName, "interest", false, function () {
					tool.interests = {};
					Q.each(this.relatedStreams, function () {
						tool.interests[Q.normalize(this.fields.title)] = {
							title: this.fields.title,
							category: this.fields.category
						};
					});
				});

				$(".Teaching_course_preview_participants", $toolElement).tool('Streams/participants', {
					publisherId: stream.fields.publisherId,
					streamName: stream.fields.name,
					max: stream.getAttribute('peopleMax') || 10,
					invite: false,
					maxShow: 10
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
		});
	},
	/**
	 * Create Course
	 * @method composer
	 * @param {function} [callback] - called when stream created
	 */
	composer: function (callback) {
		var tool = this;
		var $toolElement = $(this.element);
		var previewState = tool.preview.state;

		$toolElement.addClass("Q_working");
		Q.req("Teaching/course", "newItem", function (err, response) {
			if (err) {
				return;
			}

			var newItem = response.slots.newItem;
			previewState.publisherId = newItem.publisherId;
			previewState.streamName = newItem.streamName;
			Q.Streams.get(previewState.publisherId, previewState.streamName, function (err) {
				if (err) {
					return;
				}

				$toolElement.removeClass("Q_working");
				Q.handle(callback, tool, [this]);
				tool.stream = this;
				tool.update();
			});
		}, {
			fields: {
				publisherId: previewState.publisherId,
				category: previewState.related
			}
		});
	},
	/**
	 * Update course
	 * @method update
	 */
	update: function (callback) {
		var tool = this;
		var $toolElement = $(this.element);
		var isNew = $toolElement.hasClass("Streams_preview_composer");
		var previewState = this.preview.state;
		var publisherId = previewState.publisherId;
		var streamName = previewState.streamName;
		previewState.editable = true; // we need to upload icon

		// need to update tool.stream
		// actually on this stage stream should be cached, so Streams.get is just reading stream from cache, hence it can be used as synchronous
		Q.Streams.get(publisherId, streamName, function () {
			tool.stream = this;
		});

		Q.Dialogs.push({
			title: isNew ? tool.text.courses.NewCourse : tool.text.courses.UpdateCourse,
			className: "Teaching_course_preview_composer",
			template: {
				name: "Teaching/course/composer",
				fields: {
					title: Q.getObject("stream.fields.title", tool) || "",
					content: Q.getObject("stream.fields.content", tool) || "",
					teaserDescription: tool.stream.getAttribute("teaser:Streams/description"),
					hideTitle: tool.stream.getAttribute("hideTitle") ? "checked" : null,
					saveButtonText: isNew ? tool.text.courses.CreateCourse : tool.text.courses.UpdateCourse
				}
			},
			onActivate: function (dialog) {
				var $icon = $("img.Teaching_course_preview_icon", dialog);
				var $save = $("button[name=save]", dialog);
				var $buttonInterests = $("button[name=interests]", dialog);

				// apply Streams/preview icon behavior
				tool.preview.icon($icon[0]);

				$(".Teaching_course_composer_form_group[data-type=icon] label", dialog).on(Q.Pointer.fastclick, function () {
					$icon.click();
				});

				// interests
				tool.interests = {};
				Q.Streams.related.force(previewState.publisherId, previewState.streamName, "interest", true, function () {
					Q.each(this.relatedStreams, function () {
						tool.interests[Q.normalize(this.fields.title)] = {
							title: this.fields.title
						};
					});
					Q.Template.render("Teaching/course/preview/interests", { interests: tool.interests }, function (err, html) {
						Q.replace($(".Teaching_course_composer_interests", dialog)[0], html);
					});
					$buttonInterests.removeClass("Q_working");
				});
				$buttonInterests.on(Q.Pointer.fastclick, function () {
					Q.Dialogs.push({
						title: tool.text.courses.UpdateInterests,
						className: "Teaching_course_preview_composer_interests",
						apply: true,
						content: $("<div>").tool("Streams/interests", {
							filter: null,
							dontAllowSelecting: true
						}),
						onActivate: function (interestsDialog) {
							$(interestsDialog).on(Q.Pointer.fastclick, 'span.Streams_interest_title', function () {
								$(this).toggleClass("Q_selected");
							});
							var interestsTool = Q.Tool.from($(".Streams_interests_tool", interestsDialog), "Streams/interests");
							interestsTool.state.onReady.add(function () {
								$(".Streams_interest_title", interestsTool.element).each(function () {
									if ((tool.interestsUpdated || tool.interests)[Q.normalize([this.getAttribute("data-category"), this.getAttribute("data-interest")].join(': '))]) {
										this.classList.add("Q_selected");
									}
								});
							}, interestsTool);
						},
						onClose: function (interestsDialog) {
							tool.interestsUpdated = {};
							$(".Streams_interests_tool .Streams_interest_title.Q_selected", interestsDialog).each(function () {
								var title = [this.getAttribute("data-category"), this.getAttribute("data-interest")].join(': ');
								tool.interestsUpdated[Q.normalize(title)] = { title };
							});
							Q.Template.render("Teaching/course/preview/interests", {
								interests: tool.interestsUpdated
							}, function (err, html) {
								Q.replace($(".Teaching_course_composer_interests", dialog)[0], html);
							});
						}
					});
				});

				// teaser video
				var $box = $(".Teaching_course_composer_form_group[data-type=teaser]", dialog);
				var teaserVideoRelationType = tool.name + "_teaserVideo";
				var _listenTeaserVideoStream = function (stream) {
					stream.retain(tool);
					stream.onAttribute("Streams.videoUrl").set(function (attributes, k) {
						tool.stream.setAttribute("teaser:Streams/video", attributes[k]).save({
							onSave: function () {
								tool.stream.refresh(null, {
									messages: true,
									evenIfNotRetained: true
								});
							}
						});
					}, tool);
				};
				Q.Streams.related.force(previewState.publisherId, previewState.streamName, teaserVideoRelationType, true, function () {
					var options = {
						publisherId: previewState.publisherId,
						creatable: {
							title: tool.text.courses.TeaserVideo,
							clickable: false,
							addIconSize: 0,
							streamType: "Streams/video"
						},
						related: {
							publisherId: previewState.publisherId,
							streamName: previewState.streamName,
							type: teaserVideoRelationType
						}
					};
					if (!Q.isEmpty(this.relatedStreams)) {
						tool.teaserVideoStream = Object.values(this.relatedStreams)[0];
						options.streamName = tool.teaserVideoStream.fields.name;
						_listenTeaserVideoStream(tool.teaserVideoStream);
					}

					$("<div>").tool("Streams/preview", options).tool("Streams/video/preview", {
						title: tool.text.courses.TeaserVideo
					}).appendTo($box).activate(function () {
						Q.Tool.from(this.element, "Streams/preview").state.onCreate.set(function (stream) {
							tool.teaserVideoStream = stream;
							tool.stream.setAttribute("teaser:Streams/video", stream.videoUrl()).save({
								onSave: function () {
									tool.stream.refresh(null, {
										messages: true,
										evenIfNotRetained: true
									});
								}
							});
							_listenTeaserVideoStream(tool.teaserVideoStream);
						}, tool);

						Q.Tool.from(this.element, "Streams/video/preview").state.onInvoke.set(function () {
							var videoPreviewTool = this;
							Q.invoke({
								title: videoPreviewTool.stream.fields.title,
								content: $("<div>").tool("Q/video", {
									url: videoPreviewTool.stream.videoUrl()
								}),
								className: "Teaching_course_composer_teaser_video",
								trigger: videoPreviewTool.element,
								callback: function (options, index, div, data) {

								}
							});
						}, tool);
					});
				});

				// create course
				$save.on(Q.Pointer.fastclick, function (event) {
					event.preventDefault();
					$save.addClass("Q_working");

					var pipe = new Q.pipe(["save", "unrelate", "relate", "join", "interests"], function () {
						var relatedTool = Q.Tool.from($toolElement.closest(".Streams_related_tool"), "Streams/related");
						if (relatedTool && isNew) {
							relatedTool.refresh();
						} else {
							tool.preview.preview();
						}
						Q.handle(callback);
						$save.removeClass("Q_working");
						Q.Dialogs.pop();
					});
					tool.stream.set('title', $("input[name=title]", dialog).val());
					tool.stream.set('content', $("textarea[name=description]", dialog).val());
					tool.stream.setAttribute("teaser:Streams/description", $("textarea[name=teaserDescription]", dialog).val());
					tool.stream.save({
						onSave: pipe.fill("save")
					});

					// interests
					if (tool.interestsUpdated) {
						var interestsNormalized = Object.keys(tool.interests);
						var _interestsNormalized = Object.keys(tool.interestsUpdated);
						var interestsToRemoveNormalized = interestsNormalized.filter(x => !_interestsNormalized.includes(x));
						var interestsToAddNormalized = _interestsNormalized.filter(x => !interestsNormalized.includes(x));
						var interestsToRemove = {};
						interestsToRemoveNormalized.forEach(function(key) {
							interestsToRemove[key] = tool.interests[key];
						});
						var interestsToAdd = {};
						interestsToAddNormalized.forEach(function(key) {
							interestsToAdd[key] = tool.interestsUpdated[key];
						});

						if (interestsToRemoveNormalized.length || interestsToAddNormalized.length) {
							var slots = [];
							if (interestsToRemoveNormalized.length) {
								slots.push("removeInterests");
							}
							if (interestsToAddNormalized.length) {
								slots.push("addInterests");
							}
							Q.req("Teaching/course", slots, function (err, response) {
								pipe.fill("interests")();
								var msg = Q.firstErrorMessage(err, response);
								if (msg) {
									return Q.alert(msg);
								}
							}, {
								method: "put",
								fields: {
									publisherId: previewState.publisherId,
									streamName: previewState.streamName,
									interestsToAdd,
									interestsToRemove
								}
							});
						} else {
							pipe.fill("interests")();
						}
					}else {
						pipe.fill("interests")();
					}

					if (isNew) {
						tool.stream.unrelateFrom(previewState.related.publisherId, previewState.related.streamName, "new", pipe.fill("unrelate"));
						tool.stream.relateTo(previewState.related.type, previewState.related.publisherId, previewState.related.streamName, pipe.fill("relate"));
						Q.req("Teaching/course", ["subscription", "join"], function () {
							pipe.fill("join")();
						}, {
							method: "post",
							fields: {
								publisherId: tool.stream.fields.publisherId,
								streamName: tool.stream.fields.name
							}
						});
					} else {
						pipe.fill("unrelate")();
						pipe.fill("relate")();
						pipe.fill("join")();
					}
				});
			}
		});
	}
});

Q.Template.set('Teaching/course/preview',
`<div class="Teaching_course_preview_background" style="background-image:url({{src}})"></div>
	<div class="Teaching_course_preview_title">{{title}}</div>
	<div class="Teaching_course_preview_participants"></div>`
);

Q.Template.set('Teaching/course/composer',
	`<form class="Teaching_course_composer">
	<div class="Teaching_course_composer_form_group">
		<input type="text" name="title" value="{{title}}" class="Teaching_course_composer_form_control" placeholder="{{courses.TitlePlaceholder}}">
		<!--<label for="hideTitle"><input type="checkbox" name="hideTitle" id="hideTitle" {{hideTitle}}> {{courses.HideTitle}}</label>//-->
	</div>
	<div class="Teaching_course_composer_form_group">
		<textarea name="description" class="Teaching_course_composer_form_control" placeholder="{{courses.DescribeCourse}}">{{content}}</textarea>
	</div>
	<div class="Teaching_course_composer_form_group" data-type="icon">
		<img class="Teaching_course_preview_icon">
		<label>{{courses.CourseIcon}}</label>
	</div>
	<div class="Teaching_course_composer_form_group" data-type="interests">
		<label>{{courses.Interests}}</label>
		<div class="Teaching_course_composer_interests"></div>
		<button class="Q_button Q_working" name="interests" type="button">{{courses.UpdateInterests}}</button>
	</div>
	<div class="Teaching_course_composer_form_group" data-type="teaser">
		<label>{{courses.Teaser}}</label>
		<textarea name="teaserDescription" class="Teaching_course_composer_form_control" placeholder="{{courses.TeaserDescription}}">{{teaserDescription}}</textarea>
	</div>
	<button class="Q_button" name="save" type="button">{{saveButtonText}}</button>
</form>`, {text: ['Teaching/content']});

Q.Template.set('Teaching/course/preview/interests',
`<ul>
		{{#each interests}}
			<li>{{this.title}}</li>
		{{/each}}
		</ul>`,
	{text: ['Teaching/content']}
);

})(Q, Q.jQuery, window);