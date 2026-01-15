import 'dart:convert';
import 'package:flutter/material.dart';

/// Dynamic widget renderer that converts JSON to Flutter widgets
class WidgetRenderer {
  /// Parse JSON string and build widget tree
  static Widget render(String jsonString) {
    try {
      final Map<String, dynamic> json = jsonDecode(jsonString);
      return _buildWidget(json);
    } catch (e) {
      return _buildErrorWidget('Invalid JSON: $e');
    }
  }

  /// Build a widget from JSON map
  static Widget _buildWidget(Map<String, dynamic> json) {
    final String type = json['type'] ?? 'Container';

    switch (type) {
      case 'Text':
        return _buildText(json);
      case 'Container':
        return _buildContainer(json);
      case 'Center':
        return _buildCenter(json);
      case 'Column':
        return _buildColumn(json);
      case 'Row':
        return _buildRow(json);
      case 'SizedBox':
        return _buildSizedBox(json);
      case 'Card':
        return _buildCard(json);
      case 'Padding':
        return _buildPadding(json);
      case 'Icon':
        return _buildIcon(json);
      default:
        return _buildErrorWidget('Unknown widget type: $type');
    }
  }

  /// Build Text widget
  static Widget _buildText(Map<String, dynamic> json) {
    final String data = json['data'] ?? '';
    final Map<String, dynamic>? styleJson = json['style'];

    TextStyle? style;
    if (styleJson != null) {
      style = TextStyle(
        fontSize: (styleJson['fontSize'] as num?)?.toDouble(),
        fontWeight: _parseFontWeight(styleJson['fontWeight']),
        color: _parseColor(styleJson['color']),
        fontStyle: styleJson['fontStyle'] == 'italic' ? FontStyle.italic : null,
        letterSpacing: (styleJson['letterSpacing'] as num?)?.toDouble(),
      );
    }

    return Text(
      data,
      style: style,
      textAlign: _parseTextAlign(json['textAlign']),
    );
  }

  /// Build Container widget
  static Widget _buildContainer(Map<String, dynamic> json) {
    Widget? child;
    if (json['child'] != null) {
      child = _buildWidget(json['child']);
    }

    return Container(
      width: (json['width'] as num?)?.toDouble(),
      height: (json['height'] as num?)?.toDouble(),
      padding: _parseEdgeInsets(json['padding']),
      margin: _parseEdgeInsets(json['margin']),
      decoration: _parseBoxDecoration(json['decoration']),
      child: child,
    );
  }

  /// Build Center widget
  static Widget _buildCenter(Map<String, dynamic> json) {
    Widget? child;
    if (json['child'] != null) {
      child = _buildWidget(json['child']);
    }
    return Center(child: child);
  }

  /// Build Column widget
  static Widget _buildColumn(Map<String, dynamic> json) {
    final List<Widget> children = _buildChildren(json['children']);

    return Column(
      mainAxisAlignment: _parseMainAxisAlignment(json['mainAxisAlignment']),
      crossAxisAlignment: _parseCrossAxisAlignment(json['crossAxisAlignment']),
      mainAxisSize: json['mainAxisSize'] == 'min' ? MainAxisSize.min : MainAxisSize.max,
      children: children,
    );
  }

  /// Build Row widget
  static Widget _buildRow(Map<String, dynamic> json) {
    final List<Widget> children = _buildChildren(json['children']);

    return Row(
      mainAxisAlignment: _parseMainAxisAlignment(json['mainAxisAlignment']),
      crossAxisAlignment: _parseCrossAxisAlignment(json['crossAxisAlignment']),
      mainAxisSize: json['mainAxisSize'] == 'min' ? MainAxisSize.min : MainAxisSize.max,
      children: children,
    );
  }

  /// Build SizedBox widget
  static Widget _buildSizedBox(Map<String, dynamic> json) {
    Widget? child;
    if (json['child'] != null) {
      child = _buildWidget(json['child']);
    }

    return SizedBox(
      width: (json['width'] as num?)?.toDouble(),
      height: (json['height'] as num?)?.toDouble(),
      child: child,
    );
  }

  /// Build Card widget
  static Widget _buildCard(Map<String, dynamic> json) {
    Widget? child;
    if (json['child'] != null) {
      child = _buildWidget(json['child']);
    }

    return Card(
      color: _parseColor(json['color']),
      elevation: (json['elevation'] as num?)?.toDouble(),
      child: child,
    );
  }

  /// Build Padding widget
  static Widget _buildPadding(Map<String, dynamic> json) {
    Widget? child;
    if (json['child'] != null) {
      child = _buildWidget(json['child']);
    }

    return Padding(
      padding: _parseEdgeInsets(json['padding']) ?? EdgeInsets.zero,
      child: child,
    );
  }

  /// Build Icon widget
  static Widget _buildIcon(Map<String, dynamic> json) {
    final String? iconName = json['icon'];
    final double? size = (json['size'] as num?)?.toDouble();
    final Color? color = _parseColor(json['color']);

    // Map common icon names to IconData
    IconData iconData = _parseIconData(iconName);

    return Icon(iconData, size: size, color: color);
  }

  /// Build children list
  static List<Widget> _buildChildren(dynamic childrenJson) {
    if (childrenJson == null || childrenJson is! List) {
      return [];
    }
    return childrenJson.map((child) => _buildWidget(child)).toList();
  }

  /// Build error widget
  static Widget _buildErrorWidget(String message) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 32),
          const SizedBox(height: 8),
          Text(
            message,
            style: const TextStyle(color: Colors.red, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // === Parse Helpers ===

  static Color? _parseColor(dynamic colorValue) {
    if (colorValue == null) return null;
    if (colorValue is String) {
      // Parse hex color like "#FF5722" or "FF5722"
      String hex = colorValue.replaceFirst('#', '');
      if (hex.length == 6) {
        hex = 'FF$hex'; // Add alpha
      }
      return Color(int.parse(hex, radix: 16));
    }
    return null;
  }

  static FontWeight? _parseFontWeight(dynamic value) {
    if (value == null) return null;
    switch (value.toString().toLowerCase()) {
      case 'bold':
      case 'w700':
        return FontWeight.bold;
      case 'w600':
        return FontWeight.w600;
      case 'w500':
        return FontWeight.w500;
      case 'w400':
      case 'normal':
        return FontWeight.normal;
      case 'w300':
        return FontWeight.w300;
      default:
        return null;
    }
  }

  static TextAlign? _parseTextAlign(dynamic value) {
    if (value == null) return null;
    switch (value.toString().toLowerCase()) {
      case 'center':
        return TextAlign.center;
      case 'left':
      case 'start':
        return TextAlign.left;
      case 'right':
      case 'end':
        return TextAlign.right;
      case 'justify':
        return TextAlign.justify;
      default:
        return null;
    }
  }

  static MainAxisAlignment _parseMainAxisAlignment(dynamic value) {
    switch (value?.toString().toLowerCase()) {
      case 'center':
        return MainAxisAlignment.center;
      case 'start':
        return MainAxisAlignment.start;
      case 'end':
        return MainAxisAlignment.end;
      case 'spacebetween':
      case 'space-between':
        return MainAxisAlignment.spaceBetween;
      case 'spacearound':
      case 'space-around':
        return MainAxisAlignment.spaceAround;
      case 'spaceevenly':
      case 'space-evenly':
        return MainAxisAlignment.spaceEvenly;
      default:
        return MainAxisAlignment.start;
    }
  }

  static CrossAxisAlignment _parseCrossAxisAlignment(dynamic value) {
    switch (value?.toString().toLowerCase()) {
      case 'center':
        return CrossAxisAlignment.center;
      case 'start':
        return CrossAxisAlignment.start;
      case 'end':
        return CrossAxisAlignment.end;
      case 'stretch':
        return CrossAxisAlignment.stretch;
      default:
        return CrossAxisAlignment.center;
    }
  }

  static EdgeInsets? _parseEdgeInsets(dynamic value) {
    if (value == null) return null;
    if (value is num) {
      return EdgeInsets.all(value.toDouble());
    }
    if (value is Map) {
      return EdgeInsets.only(
        top: (value['top'] as num?)?.toDouble() ?? 0,
        bottom: (value['bottom'] as num?)?.toDouble() ?? 0,
        left: (value['left'] as num?)?.toDouble() ?? 0,
        right: (value['right'] as num?)?.toDouble() ?? 0,
      );
    }
    return null;
  }

  static BoxDecoration? _parseBoxDecoration(dynamic value) {
    if (value == null) return null;
    if (value is! Map) return null;

    return BoxDecoration(
      color: _parseColor(value['color']),
      borderRadius: value['borderRadius'] != null
          ? BorderRadius.circular((value['borderRadius'] as num).toDouble())
          : null,
    );
  }

  static IconData _parseIconData(String? iconName) {
    // Map of common icon names
    const iconMap = {
      'star': Icons.star,
      'heart': Icons.favorite,
      'home': Icons.home,
      'settings': Icons.settings,
      'check': Icons.check,
      'close': Icons.close,
      'add': Icons.add,
      'remove': Icons.remove,
      'arrow_forward': Icons.arrow_forward,
      'arrow_back': Icons.arrow_back,
      'person': Icons.person,
      'email': Icons.email,
      'phone': Icons.phone,
      'camera': Icons.camera_alt,
      'image': Icons.image,
      'search': Icons.search,
      'menu': Icons.menu,
      'more': Icons.more_vert,
      'share': Icons.share,
      'delete': Icons.delete,
      'edit': Icons.edit,
      'save': Icons.save,
      'refresh': Icons.refresh,
      'download': Icons.download,
      'upload': Icons.upload,
      'play': Icons.play_arrow,
      'pause': Icons.pause,
      'stop': Icons.stop,
    };

    return iconMap[iconName?.toLowerCase()] ?? Icons.help_outline;
  }
}
