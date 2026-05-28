require 'json'
require 'fileutils'
require 'asciidoctor'
require 'asciidoctor/pdf'
require 'asciidoctor-epub3'
require 'asciidoctor-diagram'

class CaptureLogger
  attr_reader :messages

  def initialize
    @messages = []
  end

  def add(_severity, message = nil, progname = nil)
    text = message || progname
    @messages << text.to_s if text
  end

  def debug(message = nil, &block)
    add(nil, message || block&.call)
  end

  def info(message = nil, &block)
    add(nil, message || block&.call)
  end

  def warn(message = nil, &block)
    add(nil, message || block&.call)
  end

  def error(message = nil, &block)
    add(nil, message || block&.call)
  end

  def fatal(message = nil, &block)
    add(nil, message || block&.call)
  end

  def unknown(message = nil, &block)
    add(nil, message || block&.call)
  end
end

def backend_for(format)
  case format
  when 'pdf'
    'pdf'
  when 'epub'
    'epub3'
  when 'docbook'
    'docbook5'
  else
    'html5'
  end
end

STDIN.each_line do |line|
  request = JSON.parse(line)
  logger = CaptureLogger.new

  begin
    Asciidoctor::LoggerManager.logger = logger
    backend = backend_for(request['format'])
    output = request['output']
    FileUtils.mkdir_p(File.dirname(output))

    options = {
      safe: 'unsafe',
      mkdirs: true,
      backend: backend,
      to_file: output,
      attributes: {
        'attributes-file' => request['attributesFile']
      }
    }

    Asciidoctor.convert_file(
      File.join(request['root'], request['entry']),
      options
    )

    puts JSON.generate({
      ok: true,
      warnings: logger.messages
    })
  rescue StandardError => e
    puts JSON.generate({
      ok: false,
      error: e.message,
      warnings: logger.messages,
      backtrace: e.backtrace&.take(5)
    })
  ensure
    STDOUT.flush
  end
end
